// LAW-0448 — Aceptación y contrapropuesta · inspect. Contract battery + ID-specific checks.
// coordinator decision 2026-09-26: the long-labels-stress field lengths are capped to the longest that fit 1:1 at 16 px
// (see the preset's description in the presets file); every value stays longer than baseline and every count is kept.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a real copy of the stage,
// posed identically every frame, cropped to the inspected reply row), the change is local (only that reply piece:
// the copy is lifted out and the supplied piece seated; the offer and the other pieces stay), and seeking back
// restores the old datum exactly.
// The lens (round 5, lens checklist / LAW-0688): the context stays at rest in its part of the frame; the lens grows at
// its own place in the free part (never as a blank card over the scene), crops the offer's row, the reply's row and B's
// working space, and shows the changed datum in one place at a time.
// Windows (LAW-0448.js W): open 0.20–0.32 · strike 0.35–0.41 · remove 0.43–0.58 · insert 0.50–0.62 · turn face-up
// 0.62–0.66 · new value still in the open lens 0.66–0.74 · close 0.74–0.80 · Δ 0.80–0.84 · notes 0.81–0.87.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0448';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handB', 'handBn', 'spare'],
  attach: [
    {from: 0, to: 0.619, a: 'handBn', b: 'spare', tol: 2.5},
    {from: 0.46, to: 1, a: 'handB', b: 'oldGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === 'Day 10' && !s.markerVisible", label: 'context: the reply carries the copy (before value); no marker'},
    {at: 0.34, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && JSON.stringify(s.lensCopyAt) === JSON.stringify(s.contextRowAt)", label: 'isolate: a real enlarged copy (≥ 1.5×) at the row’s own coordinates'},
    {at: 0.42, fn: "s.strike === 1 && s.datum === 'before'", label: 'the old value is struck (lens annotation) before anything changes'},
    {at: 0.55, fn: "s.datum === 'changing' && s.lensOpen === 1", label: 'cause first: B lifts the copy out, seen in the scene and in the lens'},
    {at: 0.7, fn: "s.datum === 'after' && s.lensOpen === 1 && s.lensValue === 'Day 14' && s.spareIn && s.spareFaceUp", label: 'the new value is seated face-up and shown in the open lens'},
    {at: 0.81, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'the lens has closed onto the identical row'},
    {at: 1, fn: "s.markerVisible && s.contextValue === 'Day 14' && s.allReached && s.layoutOk", label: 'return: Δ marker, new value in context; layout fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.contextValue === 'Day 10'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'term-3' && s.contextValue === '80' && s.markerVisible", label: 'another supplied focus: the fee piece is substituted'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.spareIn", label: 'labels hidden: the same isolation and substitution'},
  ],
});

ratioChecks(ID, 'lens: zoom, never over a person, field wholly inside, still value, reach', [
  {at: times(0.2, 0.8, 0.01), fn: 's.lensClearOfHeads && s.lensClearOfRows && s.allReached', label: 'the lens never covers a head or the rows it compares; every hand reaches'},
  {at: [0.3, 0.5, 0.7], fn: 's.lensShortFrac >= 0.35 && s.contextFrac >= 0.45 && s.coverFrac >= 0.8 && s.cropHasRows', label: 'lens short side ≥ 35 % of the frame; context ≥ 45 % of the width; context + lens ≥ 80 %; the offer and reply rows wholly inside'},
  {at: [0.34, 0.5, 0.7], fn: 's.zoom >= 1.5 - 1e-9 && s.lensOpen === 1 && s.changedFieldWhole', label: 'lens ≥ 1.5×; the changed field is wholly inside the lens'},
  {at: times(0.66, 0.74, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value stays still in the open lens for ≥ 400 ms'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0.1, 0.34, 0.7], fn: 's.lensDrawn', label: 'a magnifying lens is drawn (no silent no-lens fallback)'},
]);

// Rendered: the lens copy mirrors the context (same transform attributes on every copied node).
const MIRROR = `(() => {
  const ctxNodes = [...svg.querySelectorAll('[data-node^="st-"]')];
  for (const a of ctxNodes) {
    const n = a.getAttribute('data-node');
    const b = svg.querySelector('[data-node="lzs-' + n.slice(3) + '"]');
    // (the lens copy leaves out the fields its rim would cut; the changed datum is shown in one place at a time)
    if (!b || b.hasAttribute('data-lens-hidden') || /-(cp[0-9]+|pr[0-9]+|sp)-val$/.test(n)) continue;
    for (const at of ['transform', 'x1', 'y1', 'x2', 'y2', 'opacity']) if ((a.getAttribute(at) || '') !== (b.getAttribute(at) || '')) return false;
  }
  return true;
})()`;
ratioChecks(ID, 'the lens copy mirrors the scene (rendered)', [
  {at: times(0.2, 0.8, 0.03), tv: ['all'], dom: MIRROR, presets: ['baseline-illustrative', 'baseline-es'], label: 'rendered: every copied node carries the context node’s attributes'},
]);

suppliedTextSuite(ID, {
  fields: 'return [p.offer.reference, p.offer.title, ...p.parties.map(q => q.name), ...p.terms.map(t => t.label), p.responses[0].reference, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]',
  content: 'return [...p.terms.map(t => t.label), p.afterValue, p.beforeValue, ...p.parties.map(q => q.name)]',
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Rendered, dense: no lens-copy text line is cut by the lens rim; each text block is wholly in or out.
test.describe('LAW-0448 lens rim (rendered)', () => {
  test('LAW-0448: no lens-copy text crosses the rim (u 0.20–0.80, every preset × ratio × labels)', async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([presets]) => {
      const def = await window.__lib.load('LAW-0448');
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
            const shown = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
            let texts = 0;
            for (let u = 0.2; u <= 0.8 + 1e-9; u += 0.01) {
              x.seek(u * x.durationMs);
              const win = node('lens-win'), border = node('lens-border');
              if (!win || !shown(win)) continue;
              const inv = svg.getScreenCTM().inverse();
              const toRoot = (px, py) => { const q = new DOMPoint(px, py).matrixTransform(inv); return {x: q.x, y: q.y}; };
              const bm = border.getScreenCTM();
              const c0 = new DOMPoint(+border.getAttribute('x'), +border.getAttribute('y')).matrixTransform(bm);
              const c1 = new DOMPoint(+border.getAttribute('x') + +border.getAttribute('width'), +border.getAttribute('y') + +border.getAttribute('height')).matrixTransform(bm);
              const W0 = toRoot(c0.x, c0.y), W1 = toRoot(c1.x, c1.y);
              for (const t of node('lens-content').querySelectorAll('text')) {
                if (!shown(t) || !(t.textContent || '').trim()) continue;
                const spans = [...t.querySelectorAll('tspan')].filter(ts => (ts.textContent || '').trim());
                const boxOf = e => { const b = e.getBoundingClientRect(); const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom); return {p0, p1, w: b.width, h: b.height}; };
                const vis = spans.filter(ts => { const {p0, p1, w: bw, h: bh} = boxOf(ts); return bw >= 0.5 && bh >= 0.5 && p0.x < W1.x && p1.x > W0.x && p0.y < W1.y && p1.y > W0.y; });
                if (vis.length && vis.length !== spans.length) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: "${(t.textContent || '').trim().slice(0, 30)}" only partly in the lens`);
                for (const ts of vis) {
                  texts++;
                  const {p0, p1} = boxOf(ts);
                  const inside = p0.x >= W0.x - 1 && p1.x <= W1.x + 1 && p0.y >= W0.y - 1 && p1.y <= W1.y + 1;
                  if (!inside) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: "${ts.textContent.slice(0, 30)}" cut by the rim`);
                }
              }
            }
            if (tv === 'all' && !texts) out.push(`${pr.name} ${ratio}: no lens text found (test would be vacuous)`);
            x.destroy();
            el.remove();
          }
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
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

// Rendered: while the lens is open (u 0.30–0.74), its copy of the piece B holds and of the copy B lifts out stay
// wholly inside the lens window (the working space is in the crop), and the lens is at least 35 % of the frame's
// short side on its smaller dimension.
test(`${ID}: the lens keeps B's working space and is a real inspection (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const q = n => svg.querySelector(`[data-node="${n}"]`);
        const k = Math.max(0, parseInt(x.getState({bounds: false}).params.focusTarget.slice(5), 10) - 1);
        for (let s = 30; s <= 74; s += 2) {
          x.seek((s / 100) * x.durationMs);
          const win = q('lens-border').getBoundingClientRect();
          checked++;
          const sr = svg.getBoundingClientRect();
          const short = Math.min(win.width, win.height) * (w / sr.width) / Math.min(w, h);
          if (short < 0.35 - 1e-3) fails.push(`${pr.name} ${ratio} u${s / 100} lens short side ${short.toFixed(3)}`);
          for (const n of ['lzs-spare', `lzs-c${k}`]) {
            const e = q(n);
            if (!e) continue;
            const b = e.getBoundingClientRect();
            if (b.left < win.left - 2 || b.right > win.right + 2 || b.top < win.top - 2 || b.bottom > win.bottom + 2) fails.push(`${pr.name} ${ratio} u${s / 100} ${n} leaves the lens`);
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(100);
  expect(out.fails.slice(0, 20), `${out.fails.length} lens faults`).toEqual([]);
});

// Rendered, lens checklist (docs/AUTHORING.md, inspect): in every preset × ratio × labels state
//  - magnification ≥ 1.5× against the context at REST: the reply's inspected card in the lens (hold, u 0.34) vs the
//    same card in the context at u 0.10; the context card itself never shrinks (u 0.34 vs 0.10 within 1 %);
//  - the lens's SMALLER side is ≥ 35 % of the frame's short side at every u of the open lens;
//  - the changed datum in ONE place at a time, at 60 fps through open and close: the context copy and the lens copy of
//    the reply piece's value, the held piece's value and the offer's piece of that row are never both ≥ 0.15, and
//    while the lens copy shows (≥ 0.15) the context copy is hidden (< 0.02), not dimmed;
//  - the lens never lies over visible context text; nothing leaves the frame (every u step 0.01).
test(`${ID}: lens checklist — rest magnification, one copy at a time, never over text, in frame (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    const stats = {frames: 0, mags: []};
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const svg = x.element;
          const tag = `${pr.name} ${tv} ${ratio}`;
          const q = n => svg.querySelector(`[data-node="${n}"]`);
          const op = n0 => { if (!n0) return 0; let o = 1; for (let n = n0; n && n !== svg; n = n.parentNode) { const a = n.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (n.getAttribute('display') === 'none') return 0; } return o; };
          const k = Math.max(0, parseInt(x.getState({bounds: false}).params.focusTarget.slice(5), 10) - 1);
          const sr = svg.getBoundingClientRect();
          const px = w / sr.width;
          // rest magnification (card height: present with labels shown or hidden)
          x.seek(0.1 * x.durationMs);
          const rest = q(`st-c${k}`).getBoundingClientRect().height;
          x.seek(0.34 * x.durationMs);
          const held = q(`st-c${k}`).getBoundingClientRect().height;
          const inLens = q(`lzs-c${k}`).getBoundingClientRect().height;
          const mag = inLens / rest;
          stats.mags.push(`${tag} ${mag.toFixed(3)}`);
          if (!(mag >= 1.5 - 1e-3)) fails.push(`${tag} rest magnification ${mag.toFixed(3)}`);
          if (Math.abs(held / rest - 1) > 0.01) fails.push(`${tag} the context card changes size (${(held / rest).toFixed(3)})`);
          // one copy at a time (60 fps through the open and close windows)
          const pairs = [`cp${k}-val`, `pr${k}-val`, 'sp-val'].map(n => [q(`st-${n}`), q(`lzs-${n}`), n]).filter(([a, b]) => a && b);
          const step = 1000 / 60 / x.durationMs;
          for (const [u0, u1] of [[0.19, 0.3], [0.73, 0.82]]) {
            let empty = 0;
            for (let u = u0; u <= u1; u += step) {
              x.seek(u * x.durationMs);
              stats.frames++;
              // an empty lens outline (rim shown, enlarged copy < 0.15) never lasts more than ~200 ms
              empty = op(q('lens-win')) > 0.02 && op(q('lens-cfade')) < 0.15 ? empty + 1000 / 60 : 0;
              if (empty > 200 + 1e-6) { fails.push(`${tag} u${u.toFixed(4)} empty lens outline for more than 200 ms`); empty = -1e9; }
              for (const [a, b, n] of pairs) {
                const oa = op(a), ob = op(b);
                if (oa >= 0.15 && ob >= 0.15) fails.push(`${tag} u${u.toFixed(4)} ${n}: context ${oa.toFixed(2)} and lens ${ob.toFixed(2)} both legible`);
                else if (ob >= 0.15 && oa >= 0.02) fails.push(`${tag} u${u.toFixed(4)} ${n}: context copy dimmed (${oa.toFixed(2)}), not hidden`);
              }
            }
          }
          // never over visible context text; everything in frame
          const lensG = q('lens');
          const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !(lensG && lensG.contains(t)));
          for (let s = 0; s <= 100; s++) {
            x.seek((s / 100) * x.durationMs);
            const lb = q('lens-border');
            const lensOn = lb && op(lb) > 0.02 && op(q('lens-win') || lb) > 0.02;
            const win = lensOn ? lb.getBoundingClientRect() : null;
            if (s >= 30 && s <= 74) {
              const wb = lb.getBoundingClientRect();
              const short = Math.min(wb.width, wb.height) * px / Math.min(w, h);
              if (!(short >= 0.35 - 1e-3)) fails.push(`${tag} u${s / 100} lens smaller side ${short.toFixed(3)} of the short side`);
            }
            if (win && (win.left < sr.left - 1 || win.top < sr.top - 1 || win.right > sr.right + 1 || win.bottom > sr.bottom + 1)) fails.push(`${tag} u${s / 100} lens leaves the frame`);
            for (const t of texts) {
              if (op(t) < 0.05) continue;
              const b = t.getBoundingClientRect();
              if (!b.width) continue;
              if (b.left < sr.left - 1 || b.top < sr.top - 1 || b.right > sr.right + 1 || b.bottom > sr.bottom + 1) fails.push(`${tag} u${s / 100} "${t.textContent.trim().slice(0, 16)}" leaves the frame`);
              if (win) {
                const ox = Math.min(b.right, win.right) - Math.max(b.left, win.left), oy = Math.min(b.bottom, win.bottom) - Math.max(b.top, win.top);
                if (ox * px > 1 && oy * px > 1) fails.push(`${tag} u${s / 100} lens over context text "${t.textContent.trim().slice(0, 16)}"`);
              }
            }
          }
          x.destroy();
          el.remove();
        }
      }
    }
    return {fails, stats};
  }, [ID, presets]);
  console.log(JSON.stringify({frames: out.stats.frames, mags: out.stats.mags}));
  expect(out.stats.frames).toBeGreaterThan(1000);
  const seen = new Set();
  const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' ').replace(/[0-9.]+\)?$/, ''); if (seen.has(key)) return false; seen.add(key); return true; });
  expect(uniq.slice(0, 30), `${out.fails.length} lens checklist faults`).toEqual([]);
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

// Rendered: at rest (u 0.05, 0.12) and at the hold (u 0.9, 1) the scene — the context and the panel that holds the
// lens's part of the frame (LAW-0696 / LAW-0212 pattern) — fills the frame in the stacking direction: it reaches
// ≥ 0.71 of the frame from its near edge (as in LAW-0696) and spans ≥ 0.66 of it (the caption-safe box is 0.74 tall
// and 0.88 wide). Labels shown, key only and labels hidden (the panel then draws its three piece glyphs, large),
// every preset × ratio.
ratioChecks(ID, 'rest and hold fill the frame (rendered)', [
  {at: [0.05, 0.12, 0.9, 1], tv: ['all', 'key', 'none'], dom: `(() => {
    const R = svg.getBoundingClientRect();
    const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
    const bs = [...svg.querySelectorAll('[data-layer="scene"] path, [data-layer="scene"] rect, [data-layer="scene"] text, [data-layer="scene"] circle')].filter(e => !e.closest('defs') && !e.closest('clipPath') && vis(e)).map(e => e.getBoundingClientRect()).filter(q => q.width > 0 && q.height > 0);
    const right = svg.querySelector('[data-stack]').getAttribute('data-stack') === 'right';
    const lo = Math.min(...bs.map(q => right ? q.left : q.top)), hi = Math.max(...bs.map(q => right ? q.right : q.bottom));
    const D = right ? R.width : R.height, o = right ? R.left : R.top;
    return (hi - o) / D >= 0.71 && (hi - lo) / D >= 0.66;
  })()`, label: 'rendered: the scene reaches ≥ 0.71 and spans ≥ 0.66 of the frame in the stacking direction'},
]);

// Rendered, 60 fps: around the open (u 0.12–0.32) and the close (u 0.70–0.90) there is never more than ~200 ms in
// which neither the panel (opacity ≥ 0.15) nor the lens copy (window shown, enlarged copy ≥ 0.15) is readable.
// Every preset × ratio × labels state.
test(`${ID}: panel and lens hand over within 200 ms at the open and at the close (60 fps, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], worst = {};
    let frames = 0;
    for (const pr of presets) {
      for (const tv of ['all', 'key', 'none']) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const svg = x.element;
          const op = n0 => { if (!n0) return 0; let o = 1; for (let n = n0; n && n !== svg; n = n.parentNode) { const a = n.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
          const panel = ['context', 'leg0', 'leg1', 'leg2', 'key'].map(n => svg.querySelector(`[data-node="${n}"]`)).filter(Boolean);
          const win = svg.querySelector('[data-node="lens-win"]'), cf = svg.querySelector('[data-node="lens-cfade"]');
          for (const [u0, u1] of [[0.12, 0.32], [0.7, 0.9]]) {
            let gap = 0, max = 0;
            for (let t = u0 * x.durationMs; t <= u1 * x.durationMs; t += 1000 / 60) {
              x.seek(t);
              frames++;
              const readable = Math.max(...panel.map(op)) >= 0.15 || (op(win) > 0.02 && op(cf) >= 0.15);
              gap = readable ? 0 : gap + 1000 / 60;
              max = Math.max(max, gap);
            }
            const key = `${pr.name} ${tv} ${ratio} ${u0 < 0.5 ? 'open' : 'close'}`;
            worst[key] = Math.round(max);
            if (max > 200 + 1e-6) fails.push(`${key}: ${Math.round(max)} ms with neither readable`);
          }
          x.destroy();
          el.remove();
        }
      }
    }
    return {fails, frames, worst};
  }, [ID, presets]);
  console.log(JSON.stringify(out.worst));
  expect(out.frames).toBeGreaterThan(1000);
  expect(out.fails.slice(0, 25), `${out.fails.length} long gaps`).toEqual([]);
});
