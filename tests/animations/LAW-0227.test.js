// LAW-0227 — Presentación de una prueba en sala · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (whether the document is shown on
// the shared screen: the screen's state, the enlarged copy and where the others look), and no legal consequence is
// invented (no winner, score, tick, cross, red, strike or dash; the "not shown" sheet stays whole and in full colour;
// the neutral note says no conclusion).
// Timing (u): identical base until the change (0.19–0.34: a solid ring with the scenario marker ● / ◆ outlines both
// screens at the same time; the "shown" screen switches to a blank lit panel); scenario labels 0.34–0.39; the same
// carry with the same timing in A and B (pick 0.41–0.46, walk 0.46–0.58, lay down 0.58–0.63); only in the "shown"
// scenario the copy grows 0.645–0.73 and its title shows 0.73–0.755; guide 0.77–0.83; notes 0.80–0.86; still from
// u ≈ 0.86. Equal weight (strict): the same person size, label size, stroke and timing in A and B.
// Coordinator decision (standing stress rule, 2026-09-26): see `coordinatorDecision` in LAW-0227.presets.json (stress
// participants capped at three, the baseline count). The driver is label placement at 1:1 (2-4 labels without a place
// even at 16.6 px and with people at 45 px), not the people floor; the stacked + right-hand text column arrangement of
// item 20 was not tried.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0227';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['docA', 'presenterA', 'presenterB'],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.ring === 0 && s.lookA.screen === 0 && s.lookA.doc === 'table'", label: 'base: two identical complete scenes; no change drawn; the sheet on the table'},
    {at: 0.27, fn: "s.change > 0 && s.change < 1 && s.lookA.ring === s.lookB.ring && s.lookA.screen > 0 && s.lookB.screen === 0 && JSON.stringify(s.lookA.people) === JSON.stringify(s.lookB.people)", label: 'the change: both screens ringed at the same time; only the "shown" screen lights; nobody moves yet'},
    {at: 0.4, fn: 's.change === 1 && s.lookA.header === 1 && s.lookB.header === 1', label: 'the scenario labels appear once the change is drawn'},
    ...[0.44, 0.5, 0.56, 0.61].map(at => ({at, fn: "JSON.stringify(s.lookA.people) === JSON.stringify(s.lookB.people) && s.lookA.doc === s.lookB.doc && JSON.stringify(s.lookA.docAt) === JSON.stringify(s.lookB.docAt)", label: `parallel: the same carry at the same time in A and B (u=${at})`})),
    {at: 0.7, fn: "s.lookA.copy > 0 && s.lookB.copy === 0 && s.lookA.lamp === 1 && s.lookB.lamp === 0 && s.lookA.doc === 'plate' && s.lookB.doc === 'plate'", label: 'only the "shown" scenario enlarges the copy; the other keeps the sheet on the lectern'},
    {at: 1, fn: "s.displayA === 'shown' && s.displayB === 'not-shown' && s.lookA.copy === 1 && s.lookB.copy === 0 && s.lookA.screen === 1 && s.lookB.screen === 0 && s.lookB.doc === 'plate' && s.guide === 1 && s.problems.length === 0", label: 'hold: A shows the copy, B keeps the sheet on the lectern with the screen in stand-by; the guide is drawn'},
    {at: 1, fn: 'JSON.stringify(s.lookA.heads) !== JSON.stringify(s.lookB.heads)', label: 'the others look where the document is (the screen in A, the lectern in B)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.displayA === 'not-shown' && s.displayB === 'shown' && s.lookA.copy === 0 && s.lookB.copy === 1", label: 'alternative: the scenarios swapped'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', display: 'shown'}}, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'identical supplied states give identical scenes (nothing invented)'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: 's.lookA.copy > 0 && s.lookB.copy === 0', label: 'labels hidden: the same difference'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.labels.document, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean);",
  content: "return [...p.seats.map(s => s.label), p.labels.document, p.scenarioA.label, p.scenarioB.label, p.changedFact];",
  captions: "return [p.courts.building, p.courts.room];",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const VIS = "const vis = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && o !== undefined && parseFloat(o) < 0.05) return false; } return visible(e); };";
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS} ${VIS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-lab\\w+-body|[AB]-title|hdr\\d|guide-card|notes|shared-head|fact\\d)$/.test(e.getAttribute('data-node')) && vis(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// equal weight: every person in A and B at one scale; one label font size and stroke; the two markers the same size
const EQUAL_WEIGHT = `(() => {
  const sc = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  const fonts = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\w+-text$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('font-size'));
  const strokes = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\w+-body$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('stroke-width') + '/' + (e.getAttribute('stroke-dasharray') || ''));
  const rings = ['A', 'B'].map(k => svg.querySelector('[data-node="' + k + '-ring-line"]')).filter(Boolean).map(e => e.getAttribute('stroke-width'));
  const plans = ['A', 'B'].map(k => svg.querySelector('[data-node="' + k + '-plan"]').getBoundingClientRect()).map(b => Math.round(b.width));
  return sc.length > 1 && Math.max(...sc) / Math.min(...sc) < 1.005 && new Set(fonts).size <= 1 && new Set(strokes).size <= 1 && new Set(rings).size <= 1 && Math.abs(plans[0] - plans[1]) <= 1;
})()`;
// nothing dashed (the draw-on dash of the rings and leaders aside): rings, guide leaders, chip outlines, the beam
const SOLID = `(() => {
  const els = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-ring-line|guide-l\\d|[AB]-beam|[AB]-lab\\w+-body)$/.test(e.getAttribute('data-node')));
  return els.every(e => { const da = e.getAttribute('stroke-dasharray') || ''; if (!da || da === 'none') return true; const v = da.split(/[ ,]+/).map(Number); return v.length === 2 && v[1] >= v[0]; });
})()`;
// each scene's rendered width as a share of the FRAME (side by side >= 0.40, stacked >= 0.80)
const SCENE_SHARE = `(() => {
  const vb = svg.viewBox.baseVal;
  const W = vb.width * svg.getScreenCTM().a;
  const a = svg.querySelector('[data-node="A-rm-room"]').getBoundingClientRect(), b = svg.querySelector('[data-node="B-rm-room"]').getBoundingClientRect();
  const stacked = Math.abs(a.left - b.left) < 4;
  return stacked ? Math.min(a.width, b.width) >= 0.8 * W : Math.min(a.width, b.width) >= 0.4 * W;
})()`;
// the guide leaders cross no head and no text other than their own chip
const GUIDE_CLEAR = `(() => { ${K} ${BOX} ${HEADS} ${VIS}
  const card = svg.querySelector('[data-node="guide-card"]');
  if (!card || !vis(card)) return true;
  const cb = bx(card);
  const texts = [...svg.querySelectorAll('text')].filter(t => vis(t) && (t.textContent || '').trim() && !card.contains(t) && !t.closest('[data-layer="content-notice"]')).map(bx);
  const lines = [...svg.querySelectorAll('[data-node^="guide-l"]')];
  for (const ln of lines) {
    const m = ln.getScreenCTM(), L = ln.getTotalLength();
    for (let j = 1; j < 60; j++) {
      const q = ln.getPointAtLength((L * j) / 60).matrixTransform(m);
      if (q.x > cb.l - 3 && q.x < cb.r + 3 && q.y > cb.t - 3 && q.y < cb.b + 3) continue;
      if ([...heads, ...texts].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false;
    }
  }
  return true;
})()`;
// the "not shown" sheet is whole and in full colour on the lectern (not faded, struck or tinted red)
const NOT_PENALISED = `(() => {
  const ok = k => { const d = svg.querySelector('[data-node="' + k + '-doc"]'); for (let q = d; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && o !== undefined && parseFloat(o) < 0.999) return false; } return true; };
  return ok('A') && ok('B');
})()`;
const NO_RED = `(() => {
  const red = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return R > 170 && G < 90 && B < 90; };
  return [...svg.querySelectorAll('[fill], [stroke]')].every(e => !red(e.getAttribute('fill')) && !red(e.getAttribute('stroke')));
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";

ratioChecks(ID, 'cards off faces, equal weight, solid marks, wide scenes, a clear guide, nothing penalised', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, header, strip or title covers a head'},
  {at: [0, 0.5, 1], dom: EQUAL_WEIGHT, label: 'rendered: A and B at one scale; one label size and stroke; the same ring stroke'},
  {at: [0.3, 0.8, 1], dom: SOLID, label: 'rendered: rings, leaders, chips and the beam are solid (no dash pattern)'},
  {at: [0, 1], dom: SCENE_SHARE, label: 'rendered: each scene >= 40 % of the FRAME width side by side, >= 80 % stacked'},
  {at: [0.9, 1], tv: ['all'], dom: GUIDE_CLEAR, label: 'rendered: the guide leaders cross no head and no text'},
  {at: [0.7, 1], dom: NOT_PENALISED, label: 'rendered: the sheet is whole and opaque in both scenes'},
  {at: [0, 1], dom: NO_RED, label: 'rendered: no red/alarm colour anywhere'},
  {at: times(0, 1, 0.1), dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p)'},
  {at: [1], dom: FILL, label: 'rendered: the scenes and texts fill the caption-safe box'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits (labels placed, texts un-truncated, scenes wide enough)'},
]);

test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
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
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

test(`${ID}: cold create() <= 1 s in every preset × ratio`, async ({browser}) => {
  test.setTimeout(300000);
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const slow = [];
  for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, w, h, params]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params});
      await x.ready;
      return performance.now() - t0;
    }, [ID, w, h, pr.params]);
    if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
    await page.close();
  }
  expect(slow, slow.join('\n')).toEqual([]);
});
