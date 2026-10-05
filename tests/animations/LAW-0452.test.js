// LAW-0452 — Retirada de propuesta · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a real copy of the scene,
// laid out identically and posed identically every frame, cropped to the strip's receipt station(s)), the change is
// local (only the inspected event's time label: its chip turns and returns with the supplied after value; the stations
// keep the supplied order), and seeking back restores the old datum exactly. Nothing is concluded from the labels.
// Lens checklist (docs/AUTHORING.md, inspect; the contract-formation-02 LAW-0448 checks, copied and adapted to this
// scene): rest magnification ≥ 1.5×, smaller side ≥ 35 % of the frame's short side, one copy at a time at 60 fps, the
// lens copy readable with the window (empty outline ≤ 200 ms), panel/lens hand-over ≤ 200 ms, never over context text,
// in frame, no lens-copy text cut by the rim; the panel fills the lens's part at rest and hold (labels all/key/none).
// No long-labels-stress field is capped (the pre-cap copy LAW-0452.presets.precap.json equals the shipped stress preset).
// Windows (LAW-0452.js W): panel out 0.18–0.20 · open 0.20–0.28 · strike 0.36–0.42 · turn 0.47–0.53 · new value still
// in the open lens 0.53–0.74 · close 0.74–0.80 · Δ 0.80–0.84 · panel back 0.80–0.84 · notes 0.83–0.88.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults} from './cf03-rendered.js';

const ID = 'LAW-0452';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardP', 'cardW'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === 'Day 2, 10:00 (fictional)' && !s.markerVisible && s.whereP === 'B' && s.whereW === 'B'", label: 'context: the story end state (both cards in B rack); the before label; no marker'},
    {at: 0.34, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && JSON.stringify(s.lensCopyAt) === JSON.stringify(s.contextAt)", label: 'isolate: a real enlarged copy (≥ 1.5×) at the station own coordinates'},
    {at: 0.44, fn: "s.strike === 1 && s.datum === 'before'", label: 'the old label is struck (lens annotation) before anything changes'},
    {at: 0.6, fn: "s.datum === 'after' && s.lensOpen === 1 && s.lensValue === 'Day 2, 17:30 (fictional)'", label: 'the new label is shown in the scene and in the open lens'},
    {at: 0.81, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'the lens has closed onto the identical station'},
    {at: 1, fn: "s.markerVisible && s.contextValue === 'Day 2, 17:30 (fictional)' && s.allReached && s.layoutOk && JSON.stringify(s.order) === JSON.stringify(['proposal-sent','withdrawal-sent','withdrawal-received','proposal-received'])", label: 'return: Δ marker, new label in context; the stations keep the supplied order'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.contextValue === 'Day 2, 10:00 (fictional)'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'proposal-received' && s.contextValue === 'Day 5, 08:10 (fictional)' && s.markerVisible && s.order[2] === 'proposal-received'", label: 'another supplied focus: the proposal receipt label; the order stays as supplied'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.datum === 'after'", label: 'labels hidden: the same isolation and substitution'},
  ],
});

ratioChecks(ID, 'lens: zoom, never over the context, field wholly inside, still value', [
  {at: times(0.2, 0.8, 0.01), fn: 's.lensClearOfHeads && s.lensClearOfContext && s.allReached', label: 'the lens never covers a head or the context; every hand reaches'},
  {at: [0.3, 0.5, 0.7], fn: 's.lensShortFrac >= 0.35 && s.changedFieldWhole', label: 'lens short side ≥ 35 % of the frame; the inspected station wholly inside the crop'},
  {at: [0.34, 0.5, 0.7], fn: 's.zoom >= 1.5 - 1e-9 && s.lensOpen === 1', label: 'lens ≥ 1.5×'},
  {at: times(0.54, 0.74, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value stays still in the open lens for ≥ 400 ms'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0.1, 0.34, 0.7], fn: 's.lensDrawn', label: 'a magnifying lens is drawn (no silent no-lens fallback)'},
]);

// Rendered: the lens copy mirrors the context (same transform / opacity attributes on every copied node).
const MIRROR = `(() => {
  const ctxNodes = [...svg.querySelectorAll('[data-node^="st-"]')];
  for (const a of ctxNodes) {
    const n = a.getAttribute('data-node');
    const b = svg.querySelector('[data-node="lzs-' + n.slice(3) + '"]');
    // (the lens copy leaves out the fields its rim would cut; the changed datum is shown in one place at a time)
    if (!b || b.hasAttribute('data-lens-hidden') || /-(time|alt)-txt$/.test(n)) continue;
    for (const at of ['transform', 'x1', 'y1', 'x2', 'y2', 'opacity']) if ((a.getAttribute(at) || '') !== (b.getAttribute(at) || '')) return false;
  }
  return true;
})()`;
ratioChecks(ID, 'the lens copy mirrors the scene (rendered)', [
  {at: times(0.2, 0.8, 0.03), tv: ['all'], dom: MIRROR, presets: ['baseline-illustrative', 'baseline-es'], label: 'rendered: every copied node carries the context node’s attributes'},
]);

suppliedTextSuite(ID, {
  fields: `return [p.offer.reference, p.offer.title, ...p.terms.map(t => t.label + ": " + t.value), p.responses[0].reference, p.responses[0].text, ...p.parties.map(q => q.name), ...p.sequence.filter(e => e.event !== p.focusTarget).map(e => e.time), p.afterValue, p.beforeValue, p.contextLabels.context, p.contextLabels.marker]`,
  content: `return [p.afterValue, p.beforeValue, ...p.parties.map(q => q.name), p.contextLabels.context, p.contextLabels.marker]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Rendered, dense: no lens-copy text line is cut by the lens rim; each text block is wholly in or out.
test.describe('LAW-0452 lens rim (rendered)', () => {
  test('LAW-0452: no lens-copy text crosses the rim (u 0.20–0.80, every preset × ratio × labels)', async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([presets]) => {
      const def = await window.__lib.load('LAW-0452');
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

// Rendered, lens checklist (docs/AUTHORING.md, inspect): in every preset × ratio × labels state
//  - magnification ≥ 1.5× against the context at REST: the inspected station event in the lens (u 0.34) vs the
//    same event in the context at u 0.10; the context event itself never shrinks (u 0.34 vs 0.10 within 1 %);
//  - the lens's SMALLER side is ≥ 35 % of the frame's short side at every u of the open lens;
//  - the changed datum in ONE place at a time, at 60 fps through open and close: the context copy and the lens copy of
//    the inspected time label (before and after) are never both ≥ 0.15, and
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
          const fo = x.getState({bounds: false}).semantic.focusNode;
          const sr = svg.getBoundingClientRect();
          const px = w / sr.width;
          // rest magnification (card height: present with labels shown or hidden)
          x.seek(0.1 * x.durationMs);
          const rest = q(`st-${fo}`).getBoundingClientRect().height;
          x.seek(0.34 * x.durationMs);
          const held = q(`st-${fo}`).getBoundingClientRect().height;
          const inLens = q(`lzs-${fo}`).getBoundingClientRect().height;
          const mag = inLens / rest;
          stats.mags.push(`${tag} ${mag.toFixed(3)}`);
          if (!(mag >= 1.5 - 1e-3)) fails.push(`${tag} rest magnification ${mag.toFixed(3)}`);
          if (Math.abs(held / rest - 1) > 0.01) fails.push(`${tag} the context card changes size (${(held / rest).toFixed(3)})`);
          // one copy at a time (60 fps through the open and close windows)
          const pairs = [`${fo}-time-txt`, `${fo}-alt-txt`].map(n => [q(`st-${n}`), q(`lzs-${n}`), n]).filter(([a, b]) => a && b);
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
          const panel = ['context', 'leg0', 'leg1', 'kept', 'key'].map(n => svg.querySelector(`[data-node="${n}"]`)).filter(Boolean);
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

textFloor(ID, {tvs: ['all', 'key', 'none']});
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="st-card-p"]', '[data-node="st-card-w"]', '[data-node="st-A-head"]', '[data-node="st-B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 0.12, 0.9, 1]);
esDefaults(ID);
headFloor(ID, {floors: {'default|1:1': 50, 'baseline-illustrative|1:1': 50, 'baseline-es|1:1': 50, 'contrast-or-alternative|1:1': 50}});
