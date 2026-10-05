// LAW-0447 — Aceptación y contrapropuesta · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (one piece of the reply: kept in
// A, substituted in B), and no legal consequence is invented to complete the contrast.
// Two compositions (chosen per frame box): 'pair' (two complete stages; wide frames) and 'shared' (the offer, identical
// in A and B, drawn once with Party A; two reply scenes, each with its own responder). Shared windows (LAW-0447.js WS):
// latch reach 0.17–0.24 · latch press 0.24–0.30 (CHANGE) · B lifts the copy out 0.29–0.40 and seats its piece
// 0.31–0.42 · both replies carried back 0.66–0.77 · guide from 0.78. Pair windows: the same beats (W).
// coordinator decision 2026-09-26: the long-labels-stress field lengths are capped (see LAW-0447.presets.json);
// coordinator decision 2026-09-26 (LAW-0135 precedent): at 1:1 the offer pieces are drawn in full once and the reply
// copies show number tokens (key chip explains them); B's different piece is always in full.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0447';
const CHANGE = 0.24;
const P = name => presetsFor(ID).find(q => q.name === name).params;
const BASE = ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'];

contractSuite(ID, {
  continuity: ['aSet', 'bSet', 'aHandB', 'bHandB', 'bHandBn', 'bSpare', 'aCarryHand', 'bCarryHand'],
  attach: [
    // scene B: B's near hand carries the different piece until it is clipped into place
    {from: 0.34, to: 0.419, a: 'bHandBn', b: 'bSpare', tol: 2.5},
    // both replies are carried back by a hand on their tab
    {from: 0.66, to: 1, a: 'aCarryHand', b: 'aCarryGrip', tol: 1.5},
    {from: 0.66, to: 1, a: 'bCarryHand', b: 'bCarryGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0', label: 'base: two identical scenes, no scenario label yet'},
    {at: 0.23, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change beat'},
    {at: 0.3, fn: 's.a.latchOpen === 0 && s.b.latchOpen === 1', label: 'change: the same latch stays shut in A and opens in B'},
    {at: 0.43, fn: 's.a.spareIn === false && s.b.spareIn === true', label: 'B slots a different piece into its set; A keeps its piece in hand'},
    {at: 0.7, fn: 's.a.moving && s.b.moving', label: 'parallel: both replies are carried back at the same moment'},
    {at: 1, fn: 's.a.done && s.b.done && s.guide === 1 && s.allReached', label: 'guide: both replies carried back; the comparison strip is shown; hands reach'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.latchOpen === 0 && s.b.spareIn === true && s.guide === 1', label: 'labels hidden: the same contrast plays'},
  ],
});

identicalBeforeChange(ID, CHANGE);

ratioChecks(ID, 'paired layout, reach and person size', [
  {at: [1], fn: 's.layoutOk', label: 'every block fits'},
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: "s.arrangement === 'column' || s.panelFrac >= 0.4", label: 'side by side, each scene takes ≥ 40 % of the width; stacked, full width'},
  {at: [1], ratios: ['16:9'], presets: BASE, fn: 's.headPx >= 104', label: 'face ≥ 104 px (16:9)'},
  {at: [1], ratios: ['9:16'], presets: BASE, fn: 's.headPx >= 108', label: 'face ≥ 108 px (9:16)'},
  // coordinator decision 2026-09-26: 1:1 contrast heads ≥ 55 px (LAW-0171 precedent), text priority
  {at: [1], ratios: ['1:1'], presets: BASE, fn: 's.headPx >= 55', label: 'face ≥ 55 px (1:1)'},
]);

suppliedTextSuite(ID, {
  fields: `const k = p.responses[1].mode === 'one-piece-substituted' ? p.responses[1].termIndex : 1;
    return [p.offer.reference, p.offer.title, ...p.parties.map(q => q.name), ...p.terms.map(t => t.label), ...p.terms.map(t => t.value),
      p.responses[0].reference, p.responses[1].reference, p.responses[1].mode === 'one-piece-substituted' ? p.responses[1].value : null,
      p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]`,
  content: `return [...p.terms.map(t => t.label), ...p.terms.map(t => t.value), p.responses[1].mode === 'one-piece-substituted' ? p.responses[1].value : null, ...p.parties.map(q => q.name)]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Dense text-size audit (rendered): at every u step of 0.01, in every preset × ratio, EVERY visible <text> (badge
// letters, chips, card values mid-turn…) renders at or above the text floor (19.5 px in the default and baseline
// presets — and, coordinator decision 2026-09-26, baseline-es in LAW-0447 —, 16 px otherwise), measured through the real
// CTM at 1080p.
test(`${ID}: every visible text stays at or above the text floor at every moment (u step 0.01, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const ratios = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
    const big = new Set(['default', 'baseline-illustrative', 'baseline-es']);
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const floor = big.has(pr.name) ? 19.5 : 16;
        const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]'));
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const rootM = svg.getScreenCTM().inverse();
          for (const t of texts) {
            if (!t.textContent.trim()) continue;
            let op = 1, hidden = false;
            for (let n = t; n && n !== svg; n = n.parentNode) {
              const a = n.getAttribute('opacity');
              if (a !== null) op *= parseFloat(a);
              if (n.getAttribute('display') === 'none' || n.getAttribute('visibility') === 'hidden') hidden = true;
            }
            if (hidden || op < 0.02) continue;
            const m = rootM.multiply(t.getScreenCTM());
            const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
            checked++;
            if (px < floor - 0.05) fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} "${t.textContent.trim().slice(0, 24)}" ${px.toFixed(1)}px < ${floor}`);
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(1000);
  expect(out.fails.slice(0, 12), `${out.fails.length} small-text samples`).toEqual([]);
});

// Rendered: in the shared-offer composition each scene's responder, reply sheet, copies and held pieces stay inside
// that scene's own panel at every moment (u step 0.02), every preset × ratio.
test(`${ID}: each scene's people and pieces stay inside their own panel (rendered, u step 0.02)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const ratios = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const q = n => svg.querySelector(`[data-node="${n}"]`);
        if (q('panel0')) {
          for (let s = 0; s <= 50; s++) {
            x.seek((s / 50) * x.durationMs);
            const k = 1080 / Math.min(w, h);
            for (const [i, P] of [[0, 'a'], [1, 'b']]) {
              const pb = q(`panel${i}`).getBoundingClientRect();
              for (const n of [`${P}-B`, `${P}-spare`, `${P}-reply`, `${P}-c0`, `${P}-c1`, `${P}-c2`, `${P}-c3`]) {
                const e = q(n);
                if (!e) continue;
                const b = e.getBoundingClientRect();
                if (!b.width) continue;
                checked++;
                const out = Math.max(pb.left - b.left, b.right - pb.right, pb.top - b.top, b.bottom - pb.bottom) * k;
                if (out > 3) fails.push(`${pr.name} ${ratio} u${(s / 50).toFixed(2)} ${n} ${out.toFixed(1)}px outside panel${i} [l${((pb.left - b.left) * k).toFixed(0)} r${((b.right - pb.right) * k).toFixed(0)} t${((pb.top - b.top) * k).toFixed(0)} b${((b.bottom - pb.bottom) * k).toFixed(0)}]`);
              }
            }
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(500);
  expect(out.fails.filter((f, i) => i % 7 === 0).slice(0, 30), `${out.fails.length} samples outside`).toEqual([]);
});

// Rendered: no visible text is drawn over another visible text at any moment (u step 0.01, every preset × ratio).
// A text covered by a later-painted opaque card ([data-occludes]) counts as hidden.
test(`${ID}: no text is drawn over another text at any moment (u step 0.01, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const ratios = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        const occluders = [...svg.querySelectorAll('[data-occludes]')];
        const visible = n0 => {
          let op = 1;
          for (let n = n0; n && n !== svg; n = n.parentNode) {
            const a = n.getAttribute('opacity');
            if (a !== null) op *= parseFloat(a);
            if (n.getAttribute('display') === 'none') return false;
          }
          return op >= 0.05;
        };
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const occ = occluders.filter(visible).map(o => ({o, b: o.getBoundingClientRect()}));
          const vis = [];
          for (const t of texts) {
            if (!visible(t)) continue;
            const b = t.getBoundingClientRect();
            if (!b.width || !b.height) continue;
            // hidden under a later-painted card that covers most of it
            const covered = occ.some(({o, b: c}) => !o.contains(t) && (t.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING)
              && Math.max(0, Math.min(b.right, c.right) - Math.max(b.left, c.left)) * Math.max(0, Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top)) > 0.6 * b.width * b.height);
            if (!covered) vis.push({t, b});
          }
          for (let i = 0; i < vis.length; i++) {
            for (let j = i + 1; j < vis.length; j++) {
              const a = vis[i].b, c = vis[j].b;
              const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left), oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
              checked++;
              // line boxes carry leading: an overlap counts from 3 px across and a quarter of the lower line height
              if (!(ox * k > 3 && oy > 0.25 * Math.min(a.height, c.height))) continue;
              // the later-painted text sits on its own opaque card that covers the shared area: the earlier text is
              // hidden there
              const [lo, hi] = vis[i].t.compareDocumentPosition(vis[j].t) & Node.DOCUMENT_POSITION_FOLLOWING ? [vis[i].t, vis[j].t] : [vis[j].t, vis[i].t];
              const ix = {l: Math.max(a.left, c.left), r: Math.min(a.right, c.right), t: Math.max(a.top, c.top), b: Math.min(a.bottom, c.bottom)};
              if (occ.some(({o, b: q}) => o.contains(hi) && !o.contains(lo) && (lo.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING)
                && q.left <= ix.l + 1 && q.right >= ix.r - 1 && q.top <= ix.t + 1 && q.bottom >= ix.b - 1)) continue;
              fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} "${vis[i].t.textContent.trim().slice(0, 18)}" × "${vis[j].t.textContent.trim().slice(0, 18)}" ${(ox * k).toFixed(0)}×${(oy * k).toFixed(0)}px`);
            }
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(1000);
  const seen = new Set();
  const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
  expect(uniq.slice(0, 25), `${out.fails.length} overlapping text samples`).toEqual([]);
});

// Rendered determinism (seek history): after forward playback at 60 fps (and after backward seeks), the whole SVG at
// u 0.45, 0.6, 0.8 and 1 is identical to a fresh instance seeked straight there. Every attribute is a pure function of
// (params, u). Every preset × ratio.
test(`${ID}: the render does not depend on seek history (60 fps playback and backward seeks vs fresh seek)`, async ({page}) => {
  test.setTimeout(900000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let compared = 0;
    const snap = svg => [...svg.querySelectorAll("*")].map(e => `${e.tagName}|${[...e.attributes].map(a => `${a.name}=${a.value}`).join(" ")}`.replace(/law-anim-[0-9]+-/g, "law-anim-#-"));
    const make = async (w, h, params) => { const el = document.createElement('div'); document.getElementById('slots').appendChild(el); const x = def.create(el, {width: w, height: h, params}); await x.ready; return {x, el}; };
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const played = await make(w, h, pr.params);
        const fresh = await make(w, h, pr.params);
        const D = played.x.durationMs;
        const marks = [0.45, 0.6, 0.8, 1];
        const cmp = (label, u) => {
          fresh.x.seek(u * D);
          const a = snap(played.x.element), b = snap(fresh.x.element);
          compared++;
          if (a.length !== b.length) { fails.push(`${pr.name} ${ratio} ${label} u${u}: node count ${a.length} vs ${b.length}`); return; }
          const diff = a.map((v, i) => (v === b[i] ? null : i)).filter(i => i !== null);
          if (diff.length) fails.push(`${pr.name} ${ratio} ${label} u${u}: ${diff.length} nodes differ, e.g. ${a[diff[0]].slice(0, 140)} ≠ ${b[diff[0]].slice(0, 140)}`);
        };
        // forward playback at 60 fps, compared at each mark as it is reached
        let mi = 0;
        for (let t = 0; t <= D + 1e-6; t += 1000 / 60) {
          played.x.seek(t);
          while (mi < marks.length && t / D >= marks[mi] - 1e-9 && t / D < marks[mi] + 1000 / 60 / D) { played.x.seek(marks[mi] * D); cmp('forward', marks[mi]); mi++; }
        }
        played.x.seek(D);
        cmp('end', 1);
        // backward seeks from the end
        for (const u of [0.8, 0.6, 0.45, 0.1, 0.6, 1, 0.45]) { played.x.seek(u * D); cmp('backward', u); }
        for (const o of [played, fresh]) { o.x.destroy(); o.el.remove(); }
      }
    }
    return {fails, compared};
  }, [ID, presets]);
  expect(out.compared).toBeGreaterThan(100);
  expect(out.fails.slice(0, 20), `${out.fails.length} seek-history differences`).toEqual([]);
});
