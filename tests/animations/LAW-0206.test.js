// LAW-0206 — Jerarquía judicial editable · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element (anchored on the edge of the piece's footprint), the
// order does not change when seeking (the tracer's visit order is a prefix of the supplied traversal at every time,
// in any seek order), and a relation is not drawn as causality by default (no arrow unless the relationship is
// supplied as communication, sequence or causal).
// Windows (LAW-0206.js W): pieces slide apart 0.02–0.16 (captions 0.13–0.18) · relationships drawn one by one
// 0.19–0.42 · tracer 0.44–0.74 (the focus element enlarges as it is reached) · level tags 0.75–0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0206';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const PREFIX = 'JSON.stringify(s.visitOrder) === JSON.stringify(s.traversal.slice(0, s.visitOrder.length))';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: 's.separated === 0 && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible && s.captions === 0', label: 'start: the pieces gathered, nothing related, no captions'},
    {at: 0.17, fn: 's.separated === 1 && s.relationsDrawn.every(v => v === 0)', label: 'separate: the pieces are apart before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(v => v > 0) && s.relationsDrawn.some(v => v < 1)', label: 'relationships are drawn one by one'},
    {at: 0.43, fn: 's.relationsDrawn.every(v => v === 1) && !s.tracerVisible', label: 'every relationship exists before the tracer moves'},
    {at: 0.6, fn: `s.tracerVisible && s.visitOrder.length >= 2 && ${PREFIX}`, label: 'the tracer follows the supplied traversal order'},
    {at: 0.74, fn: `s.visitOrder.length === s.traversal.length && ${PREFIX} && s.focusScale > 1`, label: 'every piece visited in order; the focus element is enlarged'},
    {at: 1, fn: 's.connectorGaps.every(g => g <= 2) && s.stateShown === 1 && s.problems.length === 0', label: 'hold: every connector ends on its piece; level tags shown; layout fits'},
    {at: 1, fn: "s.kinds.every((k, i) => s.arrows[i] === (k !== 'relation')) && s.kinds.every(k => k === 'relation')", label: 'default relationships are plain relations: no arrowheads'},
    {at: 0.35, fn: 's.connectorGaps.every(g => g <= 2)', label: 'connectors stay on their pieces while being drawn'},
    {at: 0.6, fn: 's.connectorGaps.every(g => g <= 2)', label: 'connectors stay attached while the focus enlarges'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.kinds.every(k => k === 'relation') && s.arrows.every(a => a === false) && s.focus === 'room' && s.focusScale >= 1.2", label: 'alternative: plain relations only (no arrows); the room is the focus and is enlarged'},
    {at: 1, fn: 's.focusScale >= 1.2', label: 'the focus element is visibly enlarged (>= 1.2x)'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.tierBars === 3', label: 'labels hidden: the plan shows the ordering graphically (one tier bar per supplied level)'},
    {at: 1, params: {relationships: [{from: 'plan', to: 'origin', kind: 'sequence'}]}, fn: "s.kinds[0] === 'sequence' && s.arrows[0] === true", label: 'a sequence appears only when supplied (with its caption)'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.tracerVisible && s.relationsDrawn.every(v => v === 1)', label: 'labels hidden: the same relationships and tracer'},
    {at: 1, params: {relationships: [{from: 'plan', to: 'origin', kind: 'causal'}]}, fn: "s.kinds.length === 1 && s.arrows[0] === true", label: 'a causal link appears only when supplied'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.courts.levels.map(l => l.name), ...p.courts.bodies.map(b => b.label), p.labels.note, p.labels.key, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])]",
  content: 'return [...p.courts.levels.map(l => l.name), ...p.courts.bodies.map(b => b.label), ...p.elements.map(e => e.label)]',
  captions: "return [...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
// each relation label's nearest connector is its own (<= 40 px) and >= 8 px nearer than any other
const OWN_NEAREST = `(() => { ${K}
  const conns = [];
  for (const path of svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')) {
    const i = +path.getAttribute('data-node').match(/^rel(\\d+)-line$/)[1];
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 160; j++) pts.push(path.getPointAtLength((L * j) / 160).matrixTransform(m));
    conns[i] = pts;
  }
  const labels = [...svg.querySelectorAll('[data-node]')].filter(e => /^rel\\d+-lab$/.test(e.getAttribute('data-node')));
  if (!labels.length) return false;
  for (const lab of labels) {
    const i = +lab.getAttribute('data-node').match(/\\d+/)[0];
    const b0 = lab.getBoundingClientRect();
    const b = {l: b0.left, t: b0.top, r: b0.right, b: b0.bottom};
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b)))) / K;
    const own = dist(conns[i]);
    if (own > 40) return false;
    for (const [j, pts] of conns.entries()) if (pts && j !== i && dist(pts) < own + 8) return false;
  }
  return true;
})()`;
// connectors run through no other piece and under no text except their own label; their ends are not under text
const ROUTES_CLEAN = `(() => { ${K}
  const pieces = [...svg.querySelectorAll('[data-node]')].filter(e => /^el-\\w+$/.test(e.getAttribute('data-node')) && e.getBoundingClientRect().width > 1).map(e => ({id: e.getAttribute('data-node').slice(3), r: e.getBoundingClientRect()}));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  for (const path of svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')) {
    if (!visible(path)) continue;
    const i = path.getAttribute('data-node').match(/\\d+/)[0];
    const own = svg.querySelector('[data-node="rel' + i + '-lab"]');
    const m = path.getScreenCTM(), L = path.getTotalLength();
    const pts = Array.from({length: 121}, (_, j) => path.getPointAtLength(L * j / 120).matrixTransform(m));
    const endPieces = [pts[0], pts[120]].map(q => pieces.filter(pc => q.x >= pc.r.left - 3 && q.x <= pc.r.right + 3 && q.y >= pc.r.top - 3 && q.y <= pc.r.bottom + 3).map(pc => pc.id));
    for (const q of pts.slice(6, 115)) {
      if (pieces.some(pc => !endPieces[0].includes(pc.id) && !endPieces[1].includes(pc.id) && q.x > pc.r.left + 3 && q.x < pc.r.right - 3 && q.y > pc.r.top + 3 && q.y < pc.r.bottom - 3)) return false;
      if (texts.some(t => !(own && own.contains(t)) && !t.closest('[data-node^="el-"]') && (() => { const r = t.getBoundingClientRect(); return q.x > r.left && q.x < r.right && q.y > r.top && q.y < r.bottom; })())) return false;
    }
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^room-pad-p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); return hd.width / K >= 26 && e.getBoundingClientRect().width / K >= 60; });
})()`;
// the focus element (and every piece) stays inside the caption-safe box
const INSIDE = "(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); return [...svg.querySelectorAll('[data-node]')].filter(e => /^el-\\w+$/.test(e.getAttribute('data-node')) && e.getBoundingClientRect().width > 1).every(e => { const b = e.getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return p1.x >= vb.width * 0.06 - 2 && p2.x <= vb.width * 0.94 + 2 && p1.y >= vb.height * 0.06 - 2 && p2.y <= vb.height * 0.8 + 2; }); })()";
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";

// Item 5: every connector's visible length outside its own chip is >= 3x the chip's line height (the chip sits
// beside the line, never on it).
const LINK_VISIBLE = `(() => {
  for (const path of svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')) {
    if (!visible(path)) continue;
    const i = path.getAttribute('data-node').match(/\\d+/)[0];
    const lab = svg.querySelector('[data-node="rel' + i + '-lab"]');
    const lb = lab && visible(lab) ? lab.getBoundingClientRect() : null;
    const t = lab && lab.querySelector('text');
    const lh = t ? parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a * 1.2 : 0;
    const m = path.getScreenCTM(), L = path.getTotalLength();
    let vis = 0, prev = null;
    for (let j = 0; j <= 200; j++) {
      const q = path.getPointAtLength(L * j / 200).matrixTransform(m);
      if (prev && !(lb && q.x > lb.left && q.x < lb.right && q.y > lb.top && q.y < lb.bottom)) vis += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    if (lh && vis < 3 * lh) return false;
  }
  return true;
})()`;
// Item 1 (opening): while the pieces gather and separate (u 0–0.15) no piece's art covers a text of another piece
const NO_COVER_EARLY = `(() => {
  const arts = [...svg.querySelectorAll('[data-node]')].filter(e => /^el-\\w+-art$/.test(e.getAttribute('data-node')) && e.getBoundingClientRect().width > 1)
    .map(e => ({id: e.getAttribute('data-node').split('-')[1], r: e.getBoundingClientRect()}));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && t.closest('[data-node^="el-"]'));
  for (const t of texts) {
    const own = t.closest('[data-node^="el-"]').getAttribute('data-node').split('-')[1];
    const b = t.getBoundingClientRect();
    if (arts.some(a => a.id !== own && a.r.left < b.right - 1 && b.left < a.r.right - 1 && a.r.top < b.bottom - 1 && b.top < a.r.bottom - 1)) return false;
  }
  return true;
})()`;

ratioChecks(ID, 'labels own their connectors, clean routes, people size, pieces inside, fill', [
  {at: [0.45, 0.74, 1], tv: ['all'], dom: LINK_VISIBLE, label: 'rendered: every connector shows >= 3 line heights of line outside its chip'},
  {at: times(0, 0.15, 0.01), dom: NO_COVER_EARLY, label: 'rendered: during the opening no piece covers another piece\'s text'},
  {at: [0.45, 1], tv: ['all'], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (<= 40 px, others >= 8 px further)"},
  {at: [0.45, 0.74, 1], dom: ROUTES_CLEAN, label: 'rendered: connectors pass through no other piece and under no foreign text'},
  {at: [0.2, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across, heads >= 26 px (1080p)'},
  {at: [0.5, 0.74, 1], dom: INSIDE, label: 'rendered: every piece, the enlarged focus included, stays inside the caption-safe box'},
  {at: [1], dom: FILL, label: 'rendered: the mechanism fills the caption-safe box'},
  {at: [0.3, 0.6, 1], fn: 's.connectorGaps.every(g => g <= 2)', label: 'every connector ends on its piece'},
  {at: times(0.44, 0.74, 0.03), fn: PREFIX, label: 'the tracer visit order is a prefix of the supplied traversal'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Coordinator decision 2026-09-26: visible text is never below 16 px at 1080p, at every sampled time.
test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text ≥ 16 px at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
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
              if (pxs < 16 - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px`);
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

// Coordinator decision (courts-02 review 1): no shipped preset or default supplies a directed link between bodies.
test(`${ID}: no shipped preset or default supplies a directed link between bodies`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0206.js')).default;
  const bad = [];
  for (const pr of [{name: 'default', params: {}}, ...presetsFor(ID)]) {
    (pr.params.routes ?? def.defaultParams.routes).forEach((r, i) => { if (r.kind !== 'relation') bad.push(`${pr.name} routes[${i}] ${r.kind}`); });
    (pr.params.relationships ?? def.defaultParams.relationships).forEach((r, i) => { if (['origin', 'review'].includes(r.from) && ['origin', 'review'].includes(r.to) && r.kind !== 'relation') bad.push(`${pr.name} relationships[${i}] ${r.kind}`); });
  }
  expect(bad).toEqual([]);
});
