import {test, expect} from '@playwright/test';
// LAW-0688 — Prueba contrafactual causal · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a second copy of the stage
// drawn in the context's coordinates and posed from the same state every frame; its source holds the selected slot
// and the lifted position), the change is local (only the selected event's status and its dependent geometry: the
// claw, the tile, the dashed slot) and seeking back restores the old datum exactly.
// Windows (LAW-0688.js W): record card (and, for the labels-hidden rest camera, the stage) settle into the lens-phase
// place 0.17–0.225 · lens opens 0.225–0.30 (card and copy opaque within ~150 ms) · strike 0.45–0.49 · claw down
// 0.49–0.535, grip 0.535–0.55, lift 0.55–0.605 · new value 0.60–0.63 (still until 0.76) · lens closes 0.76–0.82 ·
// back 0.82–0.87 · Δ marker 0.84–0.88 · label/key 0.85–0.89.
// Review round 2: the lens crops the tile, its slot, its neighbours and the claw's whole working space (the lift never
// leaves it); it is >= 2.5× and >= 36 % of the frame's short side, next to its source.
// Review round 3: the context stays in place at full size, dimmed (never a thumbnail); the record card stays in view and
// its value turns over on screen.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0688';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['claw', 'gripPt'],
  attach: [
    // the claw carries the tile by its top from the grip to the end
    {from: 0.55, to: 1, a: 'claw', b: 'gripPt', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && !s.tileOut && !s.markerVisible", label: 'context: the model with the selected event present; no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 2.5 && s.sourceContainsSlot && s.mirror && s.copyShown === 1", label: 'isolate: a real enlarged copy (>= 2.5×) of the selected slot, posed like the scene'},
    {at: 0.52, fn: "s.strike === 1 && s.datum === 'changing' && !s.tileOut", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.tileOut && s.lift === 1 && s.lensOpen === 1 && s.mirror", label: 'the tile is lifted out of the model — in the scene and in the lens'},
    {at: 0.72, fn: "s.contextDatum === 'after' && s.lensOpen === 1", label: 'the context record turns over while the lens is still open'},
    {at: 1, fn: "s.lensOpen === 0 && s.tileOut && s.markerVisible && s.markerClear && s.contextDatum === 'after'", label: 'return: changed slot, Δ marker clear of the tiles, record shows the new value'},
    {at: 1, fn: 's.angles.every(a => a === 0)', label: 'local change: no tile falls, nothing is run'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && !s.tileOut && s.contextDatum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.substitution === 'restore' && !s.tileOut && s.lift === 0 && s.markerVisible", label: 'restore: the lifted tile is lowered back into its slot'},
    {at: 0.3, params: P('contrast-or-alternative'), fn: 's.tileOut && s.lift === 1', label: 'restore: before the change the tile hangs out of the model'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: 's.lensOpen === 1 && s.tileOut', label: 'labels hidden: the same isolation and change'},
  ],
});

ratioChecks(ID, 'lens checklist', [
  {at: [0.32, 0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 2.5 && s.lensFrac >= 0.35 && s.lensOk && s.lensOpen === 1 && s.sourceContainsSlot && s.mirror', label: 'lens >= 2.5× and >= 35 % of the short side, inside the box; source holds the slot; copy mirrors the scene'},
  {at: times(0.3, 0.76, 0.01), fn: 's.liftInLens && s.lensClearOfSource', label: 'the tile and the claw stay inside the magnified region through the whole removal; the lens never covers its source'},
  {at: times(0.63, 0.75, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value is still in the open lens for >= 400 ms'},
  {at: times(0.225, 0.83, 0.005), fn: 's.lensOpen === 0 || s.copyShown === 1 || s.lensOpen < 0.05', label: 'card and copy opaque as soon as the lens has any size (faint phase < 200 ms)'},
  {at: times(0.15, 0.9, 0.02), fn: 's.recordShown === null || s.recordShown === 1', label: 'the record card stays in full view through the inspection (its value turns over on screen)'},
  {at: [1], fn: 's.markerVisible && s.markerClear && s.layout.k === 1', label: 'Δ marker clear of the tiles; layout fits'},
]);

// Review round 3 (2026-09-26): the context stays in place at full size (dimmed), never a lone thumbnail; lens + context
// fill the safe box; the record card's text stays readable through the turnover.
test.describe(`${ID} context in place`, () => {
  test(`${ID}: context >= 0.5 of the safe width at every u; lens + context >= 80 % of the safe box while open; record text >= 16 px through the turnover`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
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
          if (cam.width < 0.5 * safe.w - 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: context ${(cam.width / safe.w).toFixed(2)} of the safe width`);
          if (s.lensOpen === 1) {
            // lens + the visible context (stage, record card, caption, legend rows)
            const rs = [cam, svg.querySelector('[data-node="lz-border"]').getBoundingClientRect()];
            for (const e of svg.querySelectorAll('[data-node="record"], [data-node="ctx-caption"], [data-node^="lg-"]')) if (eff(e) > 0.05) rs.push(e.getBoundingClientRect());
            const l = Math.max(safe.x, Math.min(...rs.map(q => q.left))), t = Math.max(safe.y, Math.min(...rs.map(q => q.top)));
            const rr = Math.min(safe.x + safe.w, Math.max(...rs.map(q => q.right))), bb = Math.min(safe.y + safe.h, Math.max(...rs.map(q => q.bottom)));
            const cov = ((rr - l) * (bb - t)) / (safe.w * safe.h);
            if (cov < 0.8) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: lens + context cover ${cov.toFixed(2)} of the safe box`);
          }
          if (tv === 'all' && u >= 0.4 && u <= 0.7) {
            const s0 = svg.getScreenCTM().a;
            for (const t of svg.querySelectorAll('[data-node="record"] text')) {
              if (!(t.textContent || '').trim()) continue;
              if (t.closest('[data-node="rec-new"]') && u < 0.63) continue;
              const px = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (eff(t) < 0.99 || px < 16 - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: record text "${t.textContent.slice(0, 16)}" opacity ${eff(t).toFixed(2)}, ${px.toFixed(1)} px`);
            }
          }
        }
        x.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered: the lens window (its border) is >= 35 % of the frame's short side and >= 2.5× its source rim.
test.describe(`${ID} lens size`, () => {
  test(`${ID}: rendered lens >= 35 % of the short side and >= 2.5× its source, every preset × ratio × labels`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        x.seek(0.6 * x.durationMs);
        const svg = x.element;
        const k = svg.getBoundingClientRect().width / w;
        const B = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect();
        const Sr = svg.querySelector('[data-node="lz-src"]').getBoundingClientRect();
        const frac = B.width / k / Math.min(w, h), zoom = B.width / Sr.width;
        if (!(frac >= 0.35 && zoom >= 2.5)) out.push(`${pr.name} ${tv} ${ratio}: ${frac.toFixed(3)} of short side, ${zoom.toFixed(2)}×`);
        x.destroy(); el.remove();
      }
      return out;
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.beforeValue, p.afterValue]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Review round 1 (2026-09-26): EVERY visible text (tags, lamps, key, chips, glyphs such as "?", "A", "B") is >= 16 px at
// 1080p at every sampled u in every preset × ratio, and >= 19.5 px in the default, baseline-illustrative and baseline-es
// presets (pattern of LAW-0194 / LAW-0196).
test.describe('LAW-0688 text size over time', () => {
  test('LAW-0688: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u', async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0688')];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          for (let u = 0; u <= 1.0001; u += 0.02) {
            x.seek(u * x.durationMs);
            const s0 = svg.getScreenCTM().a;
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
              const b = t.getBoundingClientRect();
              if (b.width < 0.5) continue;
              const fs = parseFloat(getComputedStyle(t).fontSize);
              const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px < ${floor}`);
            }
          }
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, ['LAW-0688', presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
