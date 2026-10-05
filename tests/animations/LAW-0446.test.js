// LAW-0446 — Aceptación y contrapropuesta · mechanism. Contract battery + ID-specific checks.
// coordinator decision 2026-09-26: the long-labels-stress field lengths are capped to the longest that fit 1:1 at 16 px
// (see the preset's description in the presets file); every value stays longer than baseline and every count is kept.
// acceptanceCheck (brief): every connector ends at its element, the visiting order does not change when seeking,
// and a plain relation is never drawn as causality by default.
// Windows (LAW-0446.js W): separate 0.02–0.17 · relate 0.18–0.43 · trace 0.45–0.74 · gather 0.76–0.92 (return 0.76–0.81,
// copies and the different piece in turn 0.80–0.92) · tags 0.90–0.95.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const ID = 'LAW-0446';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: 's.tilesOut === 0 && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible', label: 'separate: the copies still lie on the offer; nothing is related yet'},
    {at: 0.18, fn: 's.tilesOut === 1 && s.relationsDrawn.every(v => v === 0)', label: 'the copies are separated before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(v => v > 0) && s.relationsDrawn.some(v => v < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(v => v === 1) && !s.tracerVisible', label: 'all supplied relationships exist before the tracer moves'},
    {at: 0.5, fn: 's.anchoredEnds', label: 'every connector starts and ends on the edge of its own element'},
    {at: 0.5, fn: "!s.relationKinds.includes('causal') && s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true)", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 0.6, fn: "s.tracerVisible && s.visitOrder.length > 0 && s.visitOrder.every((id, i) => id === ['offeror','offer','pieces','reply','offeror'][i])", label: 'the tracer follows the supplied order'},
    {at: 0.6, fn: 's.focusScale > 1', label: 'the focus element (the copy set) swells while the tracer passes'},
    {at: 0.95, fn: `${ORDER} === JSON.stringify(['offeror','offer','pieces','reply','offeror'])`, label: 'the visiting order is the same after seeking elsewhere'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: nothing visited before the trace beat'},
    {at: 1, fn: 's.gathered === 1 && s.replaced === 1 && s.diff !== null && s.layoutOk && s.labelsClear', label: 'gather: copies in the reply, one replaced by the supplied piece; layout and labels fit'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.replaced === null && s.diff === null && JSON.stringify(s.visitOrder) === JSON.stringify(['offer','pieces','reply','offeror'])", label: 'alternative: every piece is kept; a different supplied order is followed'},
    {at: 0.5, params: {relationships: [{from: 'offer', to: 'pieces', kind: 'causal'}]}, fn: "s.relationKinds.length === 1 && s.relationKinds[0] === 'causal'", label: 'a causal style appears only when supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.gathered === 1 && s.relationsDrawn.every(v => v === 1)', label: 'labels hidden: the same mechanism runs'},
  ],
});

ratioChecks(ID, 'layout fits and connectors land in every preset × ratio', [
  {at: [1], fn: 's.layoutOk && s.anchoredEnds', label: 'every label found a clear place; connectors end on their elements'},
]);

// Rendered: the anatomy fills the caption-safe content box (below the notice band).
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74 - Math.min(vb.width, vb.height) * 0.057), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.55; })()";
ratioChecks(ID, 'the anatomy fills the caption-safe box (rendered)', [
  {at: [1], dom: FILL, label: 'rendered: ≥ 90 % of the safe box on its long axis, ≥ 55 % on the other'},
]);

suppliedTextSuite(ID, {
  fields: `const r0 = p.responses[0];
    return [p.offer.reference, p.offer.title, ...p.parties.map(q => q.name), ...p.terms.map(t => t.label), ...p.terms.map(t => t.value),
      r0.reference, r0.mode === 'one-piece-substituted' ? r0.value : null, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k])]`,
  content: `const r0 = p.responses[0];
    return [p.offer.reference, p.offer.title, ...p.terms.map(t => t.label), ...p.terms.map(t => t.value), r0.reference, r0.mode === 'one-piece-substituted' ? r0.value : null]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Dense text-size audit (rendered): at every u step of 0.01, in every preset × ratio, EVERY visible <text> (badge
// letters, chips, card values mid-turn…) renders at or above the text floor (19.5 px in the default, baseline and baseline-es
// presets, 16 px otherwise), measured through the real CTM at 1080p.
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

// Rendered: every relation caption sits within 40 px (1080p) of its own connector and nearer to it than to any other
// connector; every connector runs at least three caption line-heights. Every preset × ratio, at the end state.
test(`${ID}: captions sit on their own connectors; no stub connectors (rendered)`, async ({page}) => {
  test.setTimeout(300000);
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
        x.seek(x.durationMs);
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const q = n => svg.querySelector(`[data-node="${n}"]`);
        const lines = [];
        for (let i = 0; q(`c${i}-line`); i++) {
          const path = q(`c${i}-line`);
          const M = path.getScreenCTM();
          const L = path.getTotalLength();
          const pts = Array.from({length: 81}, (_, t) => { const p = path.getPointAtLength((t / 80) * L); return new DOMPoint(p.x, p.y).matrixTransform(M); });
          let len = 0;
          for (let t = 1; t < pts.length; t++) len += Math.hypot(pts[t].x - pts[t - 1].x, pts[t].y - pts[t - 1].y);
          lines.push({pts, len});
        }
        const dist = (pts, b) => Math.min(...pts.map(p => Math.hypot(Math.max(b.left - p.x, 0, p.x - b.right), Math.max(b.top - p.y, 0, p.y - b.bottom))));
        lines.forEach((ln, i) => {
          const lab = q(`labc${i}`);
          const t = lab && lab.querySelector('text');
          const lh = t ? parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(t.getScreenCTM().a * t.getScreenCTM().d)) * 1.18 : 20;
          checked++;
          if (ln.len * k < 3 * lh * k - 0.5) fails.push(`${pr.name} ${ratio} c${i} ${(ln.len * k).toFixed(0)}px < 3 lines (${(3 * lh * k).toFixed(0)}px)`);
          if (!lab) return;
          const b = lab.getBoundingClientRect();
          const own = dist(ln.pts, b) * k;
          if (own > 40) fails.push(`${pr.name} ${ratio} labc${i} ${own.toFixed(0)}px from its connector`);
          lines.forEach((o, j) => { if (j !== i && dist(o.pts, b) * k <= own) fails.push(`${pr.name} ${ratio} labc${i} nearer c${j} than its own`); });
        });
        x.destroy();
        el.remove();
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(40);
  expect(out.fails.slice(0, 20), `${out.fails.length} caption/connector faults`).toEqual([]);
});

// Rendered: the tracer never sits on printed text. It travels only along connectors (hidden while it crosses an
// element) and paints under the relation captions, so at every u step of 0.01 its visible disc (r 17) does not
// overlap any visible text painted beneath it. Every preset × ratio.
test(`${ID}: the tracer never covers text (u step 0.01, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const ratios = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
    const fails = [];
    let seen = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const tr = svg.querySelector('[data-node="tracer"]');
        const op = n0 => { let o = 1; for (let n = n0; n && n !== svg; n = n.parentNode) { const a = n.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (n.getAttribute('display') === 'none') return 0; } return o; };
        const below = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && (t.compareDocumentPosition(tr) & Node.DOCUMENT_POSITION_FOLLOWING));
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          if (op(tr) < 0.05) continue;
          seen++;
          const c = tr.getBoundingClientRect();
          for (const t of below) {
            if (op(t) < 0.05) continue;
            const b = t.getBoundingClientRect();
            const ox = Math.min(b.right, c.right) - Math.max(b.left, c.left), oy = Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top);
            if (ox > 1 && oy > 0.25 * b.height) fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} tracer × "${t.textContent.trim().slice(0, 18)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, seen};
  }, [ID, presets]);
  expect(out.seen).toBeGreaterThan(100);
  expect(out.fails.slice(0, 25), `${out.fails.length} samples`).toEqual([]);
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
