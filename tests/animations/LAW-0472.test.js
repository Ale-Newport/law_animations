// LAW-0472 — Capacidad de las partes · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a real copy of the scene, laid
// out identically and posed identically every frame, cropped to the unfolding's station with the receipt above it —
// the record that tells "data complete" from "capacity pending verification"), the change is local (only the
// unfolding's station label turns and returns with the supplied after value; only its dependent state follows — the
// grey dashed pending ring round the indicated card; the cards and the stations keep the supplied order), and seeking
// back restores the old datum exactly. Legal content (very high risk): supplied statuses only; the pending ring is a
// pending state, never a deficiency and never anything about the person (pendingNeutral); no capacity rule, age,
// majority, incapacity, guardianship, nullity, health datum or effect on a contract (noCapacityRuleWords, EN and ES);
// no jurisdiction (conceptNeutral).
// Lens checklist (docs/AUTHORING.md line 109, as in LAW-0468): rest magnification ≥ 1.6 at the default viewport and
// ≥ 1.5 at sized hosts, smaller side ≥ 35 % of the frame's short side, one copy at a time at 60 fps, panel/lens
// hand-over ≤ 200 ms, never over context text, in frame, no lens-copy text cut by the rim; the visible context ≥ 0.45;
// the Δ marker and the lens's guides clear of text; the changed datum legible inside the open lens.
// No long-labels-stress field is capped (the pre-cap copy LAW-0472.presets.precap.json equals the shipped stress preset).
// Windows (LAW-0472.js W): panel out 0.18–0.20 · open 0.20–0.28 · strike 0.36–0.42 · turn 0.47–0.53 (the pending ring
// follows the after status as the new label comes in) · close 0.74–0.80 · Δ 0.80–0.84 · panel back 0.80–0.84 · notes
// 0.81–0.85 (full opacity by u 0.85).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noCapacityRuleWords, pendingNeutral, noEmptyPanel, conceptNeutral, CAPACITY_BANNED} from './cf08-rendered.js';

const ID = 'LAW-0472';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardP', 'cardR'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === 'Data complete (as supplied)' && !s.markerVisible && s.whereP === 'B' && s.whereR === 'B' && s.status === 'data-complete'", label: 'context: the story end state (both cards received and unfolded); the before label; no marker'},
    {at: 0.34, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.6 && JSON.stringify(s.lensCopyAt) === JSON.stringify(s.contextAt)", label: 'isolate: a real enlarged copy (≥ 1.6×) at the station own coordinates'},
    {at: 0.44, fn: "s.strike === 1 && s.datum === 'before' && s.status === 'data-complete'", label: 'the old label is struck (lens annotation) before anything changes'},
    {at: 0.6, fn: "s.datum === 'after' && s.lensOpen === 1 && s.lensValue === 'Capacity pending verification' && s.status === 'pending-verification' && s.whereP === 'B' && s.whereR === 'B'", label: 'the new label in the scene and the open lens; only the pending ring follows; the cards are unchanged'},
    {at: 0.81, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'the lens has closed onto the identical station'},
    {at: 1, fn: "s.markerVisible && s.contextValue === 'Capacity pending verification' && s.allReached && s.layoutOk && s.order[4] === 'unfolded'", label: 'return: Δ marker, new label in context; the stations keep the supplied order'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.contextValue === 'Data complete (as supplied)' && s.status === 'data-complete'", label: 'seeking back restores the previous datum and status exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'unfolded' && s.contextValue === 'Data complete (as supplied)' && s.status === 'data-complete' && s.markerVisible && s.order[0] === 'cardB-sent'", label: 'alternative: the other way round — capacity pending verification becomes data complete, as supplied'},
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
  // (B's card is drawn only when the supplied sequence has its events)
  fields: `const b = p.sequence.some(e => e.event.startsWith('cardB')); return [p.offer.reference, p.offer.title, ...p.terms.map(t => t.label + ": " + t.value), ...(b ? [p.responses[0].reference, p.responses[0].text, ...p.termsB.map(t => t.label + ": " + t.value)] : []), ...p.parties.map(q => q.name), ...p.sequence.filter(e => e.event !== p.focusTarget).map(e => e.time), p.afterValue, p.beforeValue, p.contextLabels.context, p.contextLabels.marker]`,
  content: `return [p.afterValue, p.beforeValue, ...p.parties.map(q => q.name), p.contextLabels.context, p.contextLabels.marker]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Rendered, dense: no lens-copy text line is cut by the lens rim; each text block is wholly in or out.
test.describe(`${ID} lens rim (rendered)`, () => {
  test(`${ID}: no lens-copy text crosses the rim (u 0.20–0.80, every preset × ratio × labels)`, async ({page}) => {
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
    }, [ID, presets]);
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
          // rest magnification — labels shown: the inspected station, in the lens and in the context at rest (the
          // context keeps its size); labels hidden: the lens card against the indicated card AT REST (u 0.05), in both
          // dimensions (the lens test below covers every preset × ratio × labels at sized hosts too)
          const hidden = tv !== 'all';
          const pc = `card-${x.getState({bounds: false}).params.pendingParty === 'A' ? 'p' : 'r'}`;
          x.seek(0.05 * x.durationMs);
          const restB = q(hidden ? `st-${pc}` : `st-${fo}`).getBoundingClientRect();
          const rest = restB.height;
          x.seek(0.34 * x.durationMs);
          const held = q(hidden ? `st-${pc}` : `st-${fo}`).getBoundingClientRect().height;
          const lensB = q(hidden ? 'lzc-card' : `lzs-${fo}`).getBoundingClientRect();
          const inLens = lensB.height;
          const mag = hidden ? Math.min(lensB.height / restB.height, lensB.width / restB.width) : inLens / rest;
          stats.mags.push(`${tag} ${mag.toFixed(3)}`);
          if (!(mag >= 1.5 - 1e-3)) fails.push(`${tag} rest magnification ${mag.toFixed(3)}`);
          if (!hidden && Math.abs(held / rest - 1) > 0.01) fails.push(`${tag} the context card changes size (${(held / rest).toFixed(3)})`);
          if (hidden) { x.seek(0.7 * x.durationMs); const held2 = q(`st-${pc}`).getBoundingClientRect().height; if (Math.abs(held2 / held - 1) > 0.01) fails.push(`${tag} the context changes size while the lens is open`); }
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
          // (labels hidden: the lens's part holds no note at all — nothing to hand over)
          if (!panel.length) { x.destroy(); el.remove(); continue; }
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
noTextOverProps(ID, ['[data-node="st-card-p"]', '[data-node="st-card-r"]', '[data-node="st-A-head"]', '[data-node="st-B-head"]']);
seekHistory(ID);
// (labels shown: the panel and the context fill the frame at rest and at the hold; labels hidden: the lens's part holds
// no free-standing decoration at rest and at the hold — the key alone, when shown — so the fill is checked with the lens
// open, where the context and the lens fill the frame)
fill(ID, [0.05, 0.12, 0.9, 1], {tvs: ['all']});
fill(ID, [0.34, 0.5, 0.7], {tvs: ['key', 'none']});
esDefaults(ID);
headFloor(ID, {floors: {'default|1:1': 50, 'baseline-illustrative|1:1': 50, 'baseline-es|1:1': 50, 'contrast-or-alternative|1:1': 50}});
noCapacityRuleWords(ID);
conceptNeutral(ID);
noEmptyPanel(ID);

// Rendered: the open lens is never near-empty — while it is fully open and its copy faded in (u 0.30–0.72, the label's
// turn excepted), visible
// content covers ≥ 30 % of its window (≥ 40 % with labels hidden) (a 24 × 24 grid of cell centres under visible copy elements other than the
// window's own shapes; the window: the lens's border). Every preset × ratio × labels all / key / none.
test(`${ID}: the open lens is filled by its copy (rendered, content ≥ 30 % of the window)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], worst = {};
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      let mn = 1;
      // (outside the label's turn, 0.47–0.53, where the changing label is briefly hidden)
      for (const k of [30, 36, 42, 45, 56, 62, 68, 72]) {
        x.seek((k / 100) * x.durationMs);
        const B = svg.querySelector('[data-node="lens-border"]').getBoundingClientRect();
        const leaves = [...svg.querySelectorAll('[data-node="lens-cfade"] text, [data-node="lens-cfade"] path, [data-node="lens-cfade"] rect, [data-node="lens-cfade"] circle, [data-node="lens-cfade"] line, [data-node="lzc"] path, [data-node="lzc"] rect, [data-node="lzc"] circle')]
          .filter(e => !e.closest('clipPath') && !e.closest('defs') && op(e) >= 0.3).map(e => e.getBoundingClientRect())
          .filter(q => q.width * q.height > 0 && q.width * q.height < 0.9 * B.width * B.height && q.right > B.left && q.left < B.right && q.bottom > B.top && q.top < B.bottom);
        let cov = 0;
        const N = 24;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const cx = B.left + (i + 0.5) * B.width / N, cy = B.top + (j + 0.5) * B.height / N; if (leaves.some(q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) cov++; }
        mn = Math.min(mn, cov / N / N);
      }
      worst[`${pr.name} ${tv} ${ratio}`] = +mn.toFixed(2);
            if (mn < (tv === 'all' ? 0.3 : 0.4)) fails.push(`${pr.name} ${tv} ${ratio}: lens content ${mn.toFixed(2)}`);
      x.destroy();
      el.remove();
    }
    return {fails, worst};
  }, [ID, presets]);
  console.log(JSON.stringify(out.worst));
  expect(out.fails).toEqual([]);
});
pendingNeutral(ID, [[{statusBefore: 'data-complete', statusAfter: 'data-complete'}, {statusBefore: 'pending-verification', statusAfter: 'pending-verification'}], [{}, {statusAfter: 'data-complete'}]], ['st-', 'lzs-'], ['A', 'B'], {figClear: true});

// The supplied parameters of every preset carry no banned wording either (EN and ES).
test(`${ID}: no preset supplies capacity-rule, age, health or effect wording`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(CAPACITY_BANNED), pr.name).toBeNull();
});

// Rendered: the dependent state — the pending ring round the indicated card follows the supplied status: before the
// turn the before status, from the turn the after status (in the scene and, when the card is in the crop, in the lens
// copy); seeking back restores it. Default (complete → pending, B), the alternative (pending → complete, B) and the
// stress preset (complete → pending, A), every ratio.
test(`${ID}: the pending ring follows the supplied status round the indicated card (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const cases = [{name: 'default', params: {}}, ...presetsFor(ID).filter(q => q.name !== 'baseline-illustrative')];
  const out = await page.evaluate(async ([id, cases]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of cases) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const p = x.getState({bounds: false}).params;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const ringShown = () => ['st-pend', 'cx-after'].some(k => { const e = svg.querySelector(`[data-node="${k}"]`); return e && eff(e) > 0.5; });
      const card = svg.querySelector(`[data-node="st-card-${p.pendingParty === 'A' ? 'p' : 'r'}-face"]`).getBoundingClientRect();
      for (const [u, want] of [[0.1, p.statusBefore], [0.44, p.statusBefore], [0.6, p.statusAfter], [1, p.statusAfter], [0.3, p.statusBefore]]) {
        x.seek(u * x.durationMs);
        n++;
        if (ringShown() !== (want === 'pending-verification')) fails.push(`${pr.name} ${ratio} u${u}: ring ${ringShown()} for ${want}`);
        const r = ['st-pend', 'cx-after'].map(k => svg.querySelector(`[data-node="${k}"]`)).find(e => e && eff(e) > 0.5);
        if (r) { const b = r.getBoundingClientRect(); if (!(b.left >= card.left - 1 && b.right <= card.right + 1 && b.top >= card.top - 1 && b.bottom <= card.bottom + 1)) fails.push(`${pr.name} ${ratio} u${u}: ring not on the indicated card`); }
      }
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, cases]);
  expect(out.n).toBeGreaterThan(20);
  expect(out.fails).toEqual([]);
});

// Rendered (round 2): the Δ marker never lies over a text — from its first frame to the hold, every preset × ratio ×
// labels state (u step 0.01 from 0.78), its box is clear of every visible text box (the after value included) and in
// the frame.
test(`${ID}: the Δ marker is clear of every text and in the frame (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let seen = 0;
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const sr = svg.getBoundingClientRect();
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const mk = svg.querySelector('[data-node="cx-marker"]');
      for (let u = 0.78; u <= 1 + 1e-9; u += 0.01) {
        x.seek(u * x.durationMs);
        if (!mk || eff(mk) < 0.05) continue;
        seen++;
        const M = mk.getBoundingClientRect();
        if (M.left < sr.left - 1 || M.right > sr.right + 1 || M.top < sr.top - 1 || M.bottom > sr.bottom + 1) fails.push(`${pr.name} ${tv} ${ratio} u${u.toFixed(2)}: marker outside the frame`);
        for (const t of svg.querySelectorAll('text')) {
          if (mk.contains(t) || !t.textContent.trim() || eff(t) < 0.05) continue;
          const b = t.getBoundingClientRect();
          if (b.width < 1) continue;
          if (M.left < b.right - 0.5 && M.right > b.left + 0.5 && M.top < b.bottom - 0.5 && M.bottom > b.top + 0.5) fails.push(`${pr.name} ${tv} ${ratio} u${u.toFixed(2)}: marker over "${t.textContent.trim().slice(0, 30)}"`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], seen};
  }, [ID, presets]);
  expect(out.seen).toBeGreaterThan(100);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// Rendered (round 2): magnification against the context at REST — the inspected station in the lens (u 0.34) over the
// same station in the context (u 0.10) — at sized hosts: the default viewport with a full-size element (≥ 1.6, the
// layout's margin), and a 640 × 360-type element (a third of the size) and 800 × 600 / 1400 × 1000 viewports (≥ 1.5).
// Every preset (and es defaults) × ratio, labels all.
for (const [vw, vh] of [[1280, 800], [800, 600], [1400, 1000]]) {
  test(`${ID}: lens magnification ≥ 1.5 at sized hosts (viewport ${vw}×${vh}; ≥ 1.6 full-size at the default viewport) (rendered)`, async ({page}) => {
    test.setTimeout(600000);
    await page.setViewportSize({width: vw, height: vh});
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, isDefault]) => {
      const def = await window.__lib.load(id);
      const fails = [], rows = [];
      for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const sized of [false, true]) {
        const el = document.createElement('div');
        if (sized) { el.style.width = `${w / 3}px`; el.style.height = `${h / 3}px`; }
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const fo = x.getState({bounds: false}).semantic.focusNode;
        const q = n => x.element.querySelector(`[data-node="${n}"]`);
        x.seek(0.1 * x.durationMs);
        const a = q(`st-${fo}`).getBoundingClientRect().height;
        x.seek(0.34 * x.durationMs);
        const b = q(`lzs-${fo}`).getBoundingClientRect().height;
        const m = b / a;
        const floor = isDefault && !sized ? 1.6 : 1.5;
        rows.push(`${pr.name} ${w}x${h}${sized ? ' sized' : ''} ${m.toFixed(3)}`);
        if (!(m >= floor)) fails.push(`${pr.name} ${w}x${h}${sized ? ' sized' : ''}: ${m.toFixed(3)} < ${floor}`);
        x.destroy();
        el.remove();
      }
      return {fails, rows};
    }, [ID, presets, vw === 1280 && vh === 800]);
    console.log(out.rows.join(' | '));
    expect(out.fails).toEqual([]);
  });
}

// Rendered (round 2): the context left VISIBLE while the lens is open (context leaves not wholly under the lens) is
// ≥ 0.45 of the frame. Lens beside the context (stack 'right' — 16:9 and 1:1 when chosen): across the frame's width.
// Lens stacked below the context (stack 'below' — 9:16, and 1:1 when chosen): in either dimension (coordinator
// decision 2026-09-27, LAW-0232). Every preset (and es defaults) × ratio × labels state, u 0.30–0.70.
test(`${ID}: the context left visible beside or above the open lens is ≥ 0.45 of the frame (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], rows = [];
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const sr = svg.getBoundingClientRect();
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const stack = x.getState({bounds: false}).semantic.stack;
      let mn = 9;
      for (const u of [0.3, 0.4, 0.5, 0.6, 0.7]) {
        x.seek(u * x.durationMs);
        const B = svg.querySelector('[data-node="lens-border"]').getBoundingClientRect();
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const e of svg.querySelectorAll('[data-node^="st-"] path, [data-node^="st-"] rect, [data-node^="st-"] circle, [data-node^="st-"] text, [data-node^="st-"] line, [data-node^="st-"] ellipse')) {
          if (eff(e) < 0.05) continue;
          const b = e.getBoundingClientRect();
          if (b.width < 0.5 && b.height < 0.5) continue;
          if (b.left >= B.left && b.right <= B.right && b.top >= B.top && b.bottom <= B.bottom) continue;
          x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right); y0 = Math.min(y0, b.top); y1 = Math.max(y1, b.bottom);
        }
        const cw = (x1 - x0) / sr.width, ch = (y1 - y0) / sr.height;
        mn = Math.min(mn, stack === 'right' ? cw : Math.max(cw, ch));
      }
      rows.push(`${pr.name} ${tv} ${ratio} ${stack} ${mn.toFixed(3)}`);
      if (!(mn >= 0.45)) fails.push(`${pr.name} ${tv} ${ratio} (${stack}): visible context ${mn.toFixed(3)}`);
      x.destroy();
      el.remove();
    }
    return {fails, rows};
  }, [ID, presets]);
  console.log(out.rows.join('\n'));
  expect(out.fails).toEqual([]);
});

// Rendered (pre-review): the lens's dashed guide lines never cross a visible text while the lens is open — every preset
// (and es defaults) × ratio × labels state, u 0.30–0.70 step 0.02; a guide that would cross one is not drawn.
test(`${ID}: the lens's guide lines cross no visible text (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let drawn = 0;
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      for (let u = 0.3; u <= 0.7 + 1e-9; u += 0.02) {
        x.seek(u * x.durationMs);
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && eff(t) >= 0.05 && !t.closest('[data-node="lens"]') && !t.closest('[data-layer="content-notice"]')).map(t => [t, t.getBoundingClientRect()]);
        for (const n of ['lens-coneA', 'lens-coneB']) {
          const ln = svg.querySelector(`[data-node="${n}"]`);
          if (!ln || eff(ln) < 0.05) continue;
          drawn++;
          const m = ln.getScreenCTM();
          const p1 = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(m), p2 = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(m);
          for (const [t, b] of texts) {
            for (let i = 1; i < 100; i++) {
              const q = {x: p1.x + (p2.x - p1.x) * i / 100, y: p1.y + (p2.y - p1.y) * i / 100};
              if (q.x > b.left + 1 && q.x < b.right - 1 && q.y > b.top + 1 && q.y < b.bottom - 1) { fails.push(`${pr.name} ${tv} ${ratio} u${u.toFixed(2)} ${n} over "${t.textContent.trim().slice(0, 24)}"`); break; }
            }
          }
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], drawn};
  }, [ID, presets]);
  expect(out.drawn).toBeGreaterThan(0);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// Rendered (review fix): while the lens is open (u 0.30–0.70), the lens copy of the changed datum — the inspected
// station's label, before value until the turn, after value from it — is visible (opacity ≥ 0.9, outside the turn) and
// wholly inside the lens window, in every preset (and es defaults) × ratio, labels on.
test(`${ID}: the changed datum is legible inside the open lens (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let seen = 0;
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      for (let u = 0.3; u <= 0.7 + 1e-9; u += 0.02) {
        // (the label turns over 0.47–0.53: neither copy is legible while it turns)
        if (u > 0.465 && u < 0.535) continue;
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const node = svg.querySelector(`[data-node="lzs-${s.focusNode}-${s.datum === 'after' ? 'alt' : 'time'}-txt"]`);
        const B = svg.querySelector('[data-node="lens-border"]').getBoundingClientRect();
        seen++;
        if (!node) { fails.push(`${pr.name} ${ratio} u${u.toFixed(2)}: no lens copy of the datum`); continue; }
        const op = eff(node);
        const b = node.getBoundingClientRect();
        const inside = b.width > 1 && b.left >= B.left - 1 && b.right <= B.right + 1 && b.top >= B.top - 1 && b.bottom <= B.bottom + 1;
        if (op < 0.9 || !inside) fails.push(`${pr.name} ${ratio} u${u.toFixed(2)}: datum copy opacity ${op.toFixed(2)}, inside ${inside}`);
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], seen};
  }, [ID, presets]);
  expect(out.seen).toBeGreaterThan(100);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// Labels hidden (key / none), rendered: the lens shows the change itself — its copy holds the indicated card, unfolded
// (its attribute rows visible), and between the open lens before the turn (u 0.44) and after it (u 0.6) a non-text part
// wholly inside the lens window changes visibly (the dashed pending outline comes or goes). Every preset × ratio.
test(`${ID}: labels hidden — a visible non-text change happens inside the lens, on the indicated card (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const tv of ['key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const p = x.getState({bounds: false}).params;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const tag = `${pr.name} ${tv} ${ratio}`;
      const look = () => {
        const W = svg.querySelector('[data-node="lens-border"]').getBoundingClientRect();
        const inW = b => b.width > 0 && b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1;
        return [...svg.querySelectorAll('[data-node="lens"] path, [data-node="lens"] rect, [data-node="lens"] circle, [data-node="lens"] line, [data-node="lzc"] path, [data-node="lzc"] rect, [data-node="lzc"] circle')]
          .filter(e => !e.closest('clipPath') && !e.closest('defs')).map(e => ({e, o: eff(e), inside: inW(e.getBoundingClientRect())}));
      };
      x.seek(0.44 * x.durationMs);
      const a = look();
      // (the lens card: the indicated card drawn at lens scale, unfolded)
      const card = svg.querySelector('[data-node="lzc-card-face"]');
      const attrs = svg.querySelector('[data-node="lzc-card-attrs"]');
      if (!card || eff(card) < 0.9) fails.push(`${tag}: the indicated card is not in the lens`);
      const W0 = svg.querySelector('[data-node="lens-border"]').getBoundingClientRect(), cb = card ? card.getBoundingClientRect() : null;
      if (cb && !(cb.left >= W0.left - 1 && cb.right <= W0.right + 1 && cb.top >= W0.top - 1 && cb.bottom <= W0.bottom + 1)) fails.push(`${tag}: the card is cut by the lens`);
      if (!attrs || eff(attrs) < 0.9 || attrs.querySelectorAll('rect').length < 2) fails.push(`${tag}: the attribute rows are not shown in the lens`);
      // (its glyph at card size: never larger than ~1.2× a row's pitch)
      const gl = card ? card.querySelector('[data-node="lzc-card-hd"] circle, [data-node="lzc-card-hd"] path') : null;
      const rows = attrs ? [...attrs.querySelectorAll('rect')].map(e => e.getBoundingClientRect()) : [];
      if (gl && rows.length >= 2) { const pitch = Math.abs(rows[1].top - rows[0].top); const gh = gl.getBoundingClientRect().height; if (gh > 1.2 * pitch + 1) fails.push(`${tag}: lens glyph ${gh.toFixed(0)} px over 1.2 × the row pitch ${pitch.toFixed(0)} px`); }
      x.seek(0.6 * x.durationMs);
      const b = look();
      n++;
      const changed = a.some((q, i) => b[i] && q.inside && b[i].inside && Math.abs(q.o - b[i].o) >= 0.5);
      if (!changed) fails.push(`${tag}: nothing visible changes inside the lens`);
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, presets]);
  expect(out.n).toBeGreaterThan(20);
  expect(out.fails).toEqual([]);
});

// Rendered: the lens's source frame never crosses a person (the whole drawn figure) or a caption, while it is drawn
// (u 0.20–0.80, every preset × ratio × labels all / key / none).
test(`${ID}: the lens's source frame crosses no person, no caption and no text (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      for (let k = 20; k <= 80; k += 4) {
        x.seek((k / 100) * x.durationMs);
        const src = svg.querySelector('[data-node="lens-src"]');
        if (!src || eff(src) < 0.05) continue;
        n++;
        const S = src.getBoundingClientRect();
        // (and no visible text of the context: each is wholly inside the frame or wholly outside it)
        for (const t of svg.querySelectorAll('text')) {
          if (!t.textContent.trim() || eff(t) < 0.05 || t.closest('[data-node="lens"]') || t.closest('[data-layer="content-notice"]')) continue;
          const b = t.getBoundingClientRect();
          if (!b.width) continue;
          const meet = b.left < S.right - 1 && b.right > S.left + 1 && b.top < S.bottom - 1 && b.bottom > S.top + 1;
          const within = b.left >= S.left - 1 && b.right <= S.right + 1 && b.top >= S.top - 1 && b.bottom <= S.bottom + 1;
          if (meet && !within) fails.push(`${pr.name} ${tv} ${ratio}: the source frame crosses "${t.textContent.trim().slice(0, 20)}"`);
        }
        for (const nm of ['st-A', 'st-B', 'st-name0', 'st-name1']) {
          const e = svg.querySelector(`[data-node="${nm}"]`);
          if (!e || eff(e) < 0.05) continue;
          const b = e.getBoundingClientRect();
          const meet = b.left < S.right - 2 && b.right > S.left + 2 && b.top < S.bottom - 2 && b.bottom > S.top + 2;
          const within = b.left >= S.left && b.right <= S.right && b.top >= S.top && b.bottom <= S.bottom;
          if (meet && !within) fails.push(`${pr.name} ${tv} ${ratio}: the source frame crosses ${nm}`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], n};
  }, [ID, presets]);
  expect(out.n).toBeGreaterThan(100);
  expect(out.fails).toEqual([]);
});

// Rendered: labels hidden, at rest and at the hold, no free-standing ●/◆ legend glyphs are drawn in the lens's part
// (a legend without its text explains nothing); the key, when shown, is the only note there.
test(`${ID}: labels hidden — no free-standing legend glyphs at rest or at the hold (rendered)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const tv of ['key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {textVisibility: tv}});
      await x.ready;
      for (const u of [0.05, 1]) {
        x.seek(u * x.durationMs);
        for (const nm of ['leg0', 'leg1']) { const e = x.element.querySelector(`[data-node="${nm}"]`); if (e && e.getAttribute('opacity') !== '0') fails.push(`${tv} ${ratio} u${u}: ${nm}`); }
      }
      x.destroy();
      el.remove();
    }
    return fails;
  }, ID);
  expect(out).toEqual([]);
});

// The acting scene keeps its share of the frame with labels shown (no thumbnails beside the text): on wide frames the
// people and racks span ≥ 0.55 of the width beside the panel; on tall frames they keep ≥ 0.2 of the height.
ratioChecks(ID, 'the scene keeps its share of the frame beside the text', [
  {at: [0.1, 0.5, 1], tv: ['all'], ratios: ['16:9'], fn: 's.stageW >= 0.55', label: 'wide frames: people and racks ≥ 0.55 of the width'},
  {at: [0.1, 0.5, 1], tv: ['all'], ratios: ['9:16'], fn: 's.stageH >= 0.2', label: 'tall frames: people and racks ≥ 0.2 of the height'},
]);

// Labels hidden (key / none), rendered: at rest and at the hold the scene takes ≥ 0.55 of the frame's area — of its
// height on 9:16 — (no text column), with full cards — each card wider than tall, unfolded at the hold with its row bars, never a glyph token —
// and each person wears the ●/◆ badge of their card: both present, the same size (± 3 %), clear of the faces.
test(`${ID}: labels hidden — the scene fills the frame at rest and at the hold, full cards, ownership badges (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], rows = [];
    for (const pr of presets) for (const tv of ['key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const R = svg.getBoundingClientRect();
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const tag = `${pr.name} ${tv} ${ratio}`;
      for (const u of [0.05, 1]) {
        x.seek(u * x.durationMs);
        const bs = [...svg.querySelectorAll('[data-node="ctxz"] path, [data-node="ctxz"] rect, [data-node="ctxz"] circle, [data-node="ctxz"] text')].filter(e => !e.closest('defs') && eff(e) >= 0.05).map(e => e.getBoundingClientRect()).filter(q => q.width > 0 && q.height > 0);
        const x0 = Math.min(...bs.map(q => q.left)), x1 = Math.max(...bs.map(q => q.right)), y0 = Math.min(...bs.map(q => q.top)), y1 = Math.max(...bs.map(q => q.bottom));
        // (the share of the frame's area — of its height on tall frames)
        const area = ratio === '9:16' ? (y1 - y0) / R.height : (x1 - x0) * (y1 - y0) / (R.width * R.height);
        rows.push(`${tag} u${u} ${area.toFixed(2)}`);
        if (area < 0.55) fails.push(`${tag} u${u}: scene ${area.toFixed(2)} of the frame`);
        for (const c of ['p', 'r']) {
          const f0 = svg.querySelector(`[data-node="st-card-${c}-face"]`);
          if (!f0) continue;
          const b = f0.getBoundingClientRect();
          if (b.width < 1.4 * b.height) fails.push(`${tag} u${u}: card ${c} drawn as a token`);
          if (u === 1 && eff(svg.querySelector(`[data-node="st-card-${c}-attrs"]`)) < 0.9) fails.push(`${tag}: card ${c} not unfolded at the hold`);
        }
        const bA = svg.querySelector('[data-node="st-badgeA"]'), bB = svg.querySelector('[data-node="st-badgeB"]');
        if (!bA || !bB || eff(bA) < 0.9 || eff(bB) < 0.9) { fails.push(`${tag} u${u}: badges missing`); continue; }
        const ra = bA.getBoundingClientRect(), rb = bB.getBoundingClientRect();
        if (Math.abs(ra.width / rb.width - 1) > 0.03) fails.push(`${tag}: badges of unequal size`);
        for (const [bd, f] of [[ra, 'A'], [rb, 'B'], [ra, 'B'], [rb, 'A']]) {
          const face = svg.querySelector(`[data-node="st-${f}-head"] > circle`);
          if (!face) continue;
          const q = face.getBoundingClientRect();
          if (bd.left < q.right + 2 && bd.right > q.left - 2 && bd.top < q.bottom + 2 && bd.bottom > q.top - 2) fails.push(`${tag}: a badge touches ${f}'s face`);
        }
        if (svg.querySelector('[data-node="st-badgeA"] circle:nth-of-type(2)') === null && !svg.querySelector('[data-node="st-badgeA"] > circle + circle, [data-node="st-badgeA"] > circle ~ *')) fails.push(`${tag}: badge A has no glyph`);
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], rows};
  }, [ID, presets]);
  console.log(out.rows.join(' | '));
  expect(out.fails).toEqual([]);
});

// Labels hidden (key / none), rendered at full size and at sized hosts (1/2, 1/3): the lens card is ≥ 1.5× the
// indicated card AT REST (u 0.05) in both dimensions (the layout aims at ≥ 1.62), every preset × ratio.
test(`${ID}: labels hidden — the lens card is ≥ 1.5× the card at rest in both dimensions, at every host size (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], mags = [];
    for (const div of [1, 2, 3]) for (const pr of presets) for (const tv of ['key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      if (div > 1) { el.style.width = `${w / div}px`; el.style.height = `${h / div}px`; }
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const pc = x.getState({bounds: false}).params.pendingParty === 'A' ? 'p' : 'r';
      x.seek(0.05 * x.durationMs);
      const rest = svg.querySelector(`[data-node="st-card-${pc}"]`).getBoundingClientRect();
      x.seek(0.5 * x.durationMs);
      const lens = svg.querySelector('[data-node="lzc-card"]').getBoundingClientRect();
      const mw = lens.width / rest.width, mh = lens.height / rest.height;
      mags.push(`${div} ${pr.name} ${tv} ${ratio} ${mw.toFixed(2)}/${mh.toFixed(2)}`);
      if (mw < 1.5 || mh < 1.5) fails.push(`1/${div} ${pr.name} ${tv} ${ratio}: ${mw.toFixed(2)} × ${mh.toFixed(2)}`);
      x.destroy();
      el.remove();
    }
    return {fails, mags};
  }, [ID, presets]);
  console.log(out.mags.filter((m, i) => i % 7 === 0).join(' | '));
  expect(out.fails).toEqual([]);
});

// Labels hidden at 16:9 (AUTHORING item 18; cf-08 round 4): the magnification is not bought by shrinking the context —
// at rest and at the hold the cards are ≥ 0.12 of the frame's width and the scene (people, racks, strip) spans ≥ 0.8
// of it, and the lens enlarges the card at rest ≤ 2.3× (not a thumbnail context), every preset.
test(`${ID}: labels hidden, 16:9 — large cards at rest and at the hold, the scene across the frame (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], rows = [];
    for (const pr of presets) for (const tv of ['key', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1920, height: 1080, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const R = svg.getBoundingClientRect();
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const pc = x.getState({bounds: false}).params.pendingParty === 'A' ? 'p' : 'r';
      const tag = `${pr.name} ${tv}`;
      let rest = null;
      for (const u of [0.05, 1]) {
        x.seek(u * x.durationMs);
        for (const c of ['p', 'r']) {
          const b = svg.querySelector(`[data-node="st-card-${c}"]`).getBoundingClientRect();
          if (b.width / R.width < 0.12) fails.push(`${tag} u${u}: card ${c} ${(b.width / R.width).toFixed(3)} of the width`);
          if (c === pc && u === 0.05) rest = b;
        }
        const bs = [...svg.querySelectorAll('[data-node="ctxz"] path, [data-node="ctxz"] rect, [data-node="ctxz"] circle')].filter(e => !e.closest('defs') && eff(e) >= 0.05).map(e => e.getBoundingClientRect()).filter(q => q.width > 0 && q.height > 0);
        const span = (Math.max(...bs.map(q => q.right)) - Math.min(...bs.map(q => q.left))) / R.width;
        rows.push(`${tag} u${u} card ${(rest.width / R.width).toFixed(3)} span ${span.toFixed(2)}`);
        if (span < 0.8) fails.push(`${tag} u${u}: scene spans ${span.toFixed(2)} of the width`);
      }
      x.seek(0.5 * x.durationMs);
      const lz = svg.querySelector('[data-node="lzc-card"]').getBoundingClientRect();
      const mw = lz.width / rest.width, mh = lz.height / rest.height;
      if (mw > 2.3 || mh > 2.3) fails.push(`${tag}: lens ${mw.toFixed(2)} × ${mh.toFixed(2)} the card at rest — the context shrunk`);
      x.destroy();
      el.remove();
    }
    return {fails, rows};
  }, [ID, presets]);
  console.log(out.rows.filter((m, i) => i % 4 === 0).join(' | '));
  expect(out.fails).toEqual([]);
});

// Labels hidden, rendered at 60 fps: one copy of the changed state at a time — the dashed outline on the context card
// and on the lens card are never both visible (≥ 0.15), and while the status is pending, neither is missing for more
// than 200 ms (open 0.15–0.35, close 0.68–0.88), every preset × ratio.
test(`${ID}: labels hidden — the pending outline shows in one place at a time, handed over within 200 ms (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID), {name: 'pending-both', params: {statusBefore: 'pending-verification', statusAfter: 'pending-verification'}}];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let frames = 0;
    for (const pr of presets) for (const tv of ['key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { if (!e) return 0; let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const vis = names => Math.max(...names.map(n => eff(svg.querySelector(`[data-node="${n}"]`))));
      for (const [u0, u1] of [[0.15, 0.35], [0.68, 0.88]]) {
        let gap = 0;
        for (let t = u0 * x.durationMs; t <= u1 * x.durationMs; t += 1000 / 60) {
          x.seek(t);
          frames++;
          const c = vis(['st-pend', 'cx-after']), l = vis(['lzc-pend', 'lzc-after']);
          if (c >= 0.15 && l >= 0.15) { fails.push(`${pr.name} ${tv} ${ratio} t${Math.round(t)}: both outlines visible`); break; }
          const pending = x.getState({bounds: false}).semantic.status === 'pending-verification';
          gap = pending && c < 0.15 && l < 0.15 ? gap + 1000 / 60 : 0;
          if (gap > 200 + 1e-6) { fails.push(`${pr.name} ${tv} ${ratio}: no outline for over 200 ms near t${Math.round(t)}`); break; }
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], frames};
  }, [ID, presets]);
  expect(out.frames).toBeGreaterThan(1000);
  expect(out.fails.slice(0, 20)).toEqual([]);
});
