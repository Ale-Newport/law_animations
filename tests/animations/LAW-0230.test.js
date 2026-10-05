// LAW-0230 — Deliberación separada · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking, and a
// relation is never drawn as causality by default (plain lines, no arrowheads; a causal link only when supplied).
// Timing (u): the door closes 0.02–0.06, the public space moves 0.05–0.16, cards 0.08–0.17 · relationships drawn one
// after another 0.18–0.42 · tracer 0.44–0.74 with the focus element enlarged · gathered states 0.77–0.83.
// Standing coordinator rule (2026-09-26, from LAW-0687/0689–0692; AUTHORING item 20): the long-labels-stress preset
// is capped (text lengths, and in round 2 the relationship count 6 -> 4 = baseline, for label traceability; fallbacks and
// measurements in the presets note); every check below applies to it unchanged. People floors: coordinator decisions
// recorded in production/SESSION_HANDOFF.md.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {test, expect} from '@playwright/test';
import {textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, equalWeightTest, wordingTest, noArrowsTest, fillMostTest, thinContentTest, RATIOS} from './deliberacion-separada-checks.js';

const ID = 'LAW-0230';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['pub', 'tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.door === 1 && s.move === 0 && s.relationsDrawn.every(v => v === 0)", label: 'start: the spaces joined, no relationship drawn'},
    {at: 0.18, fn: 's.separated && s.door === 0 && s.relationsDrawn.every(v => v === 0)', label: 'separate: the door closed, then the public space apart, by u 0.18; relationships not yet drawn'},
    {at: 0.3, fn: 's.relationsDrawn[0] === 1 && s.relationsDrawn[s.relationsDrawn.length - 1] < 1', label: 'relationships are drawn one after another'},
    {at: 0.43, fn: 's.relationsDrawn.every(v => v === 1) && !s.relationKinds.includes(\'causal\')', label: 'all supplied relationships drawn; none is causal unless supplied'},
    {at: 0.6, fn: "s.tracer !== null && s.focusScale > 1.15 && s.focus === 'partition'", label: 'the tracer runs while the focus element is enlarged'},
    {at: 0.745, fn: "s.tracerAt === 'track'", label: 'the tracer ends on the last element of the traversal order'},
    {at: 1, fn: "s.gathered === 1 && s.focusScale === 1 && s.separated && s.problems.length === 0", label: 'gathered: origin, transformation and state visible; composition fits'},
    {at: 0.5, fn: "JSON.stringify(s.traversal) === JSON.stringify(['participants', 'publicSpace', 'partition', 'track'])", label: 'the traversal order is the supplied one (seek-independent)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.relationKinds.length === 3 && s.focus === 'track'", label: 'only the supplied relationships are drawn; the supplied focus'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 's.separated', label: 'labels hidden: the separated elements are still shown'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.hearing, p.courts.deliberation, p.routes.track, p.routes.partition, p.seats.bench, ...p.seats.participants.map(q => q.name), p.labels.gap, ...(p.relationships.some(q => q.kind === 'sequence') ? [p.labels.sequence] : []), p.labels.key, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k])];",
  content: 'return [p.courts.hearing, p.courts.deliberation, ...p.elements.map(e => e.label)];',
  captions: 'return [p.routes.track, p.routes.partition, p.seats.bench, p.labels.gap];',
});

// ---------------------------------------------------------------------------------------------
// every relationship's line starts on its first element's card and ends on its second's (rendered)
const ENDS = `(() => {
  const st = x => x; void st;
  const lines = [...svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')];
  const boxOf = id => { const e = svg.querySelector('[data-node="card-' + id + '-chip"]'); return e ? e.getBoundingClientRect() : null; };
  const near = (q, b) => b && q.x >= b.left - 6 && q.x <= b.right + 6 && q.y >= b.top - 6 && q.y <= b.bottom + 6;
  const ends = JSON.parse(svg.closest('.slot, div').dataset.ends || 'null');
  return lines.every(l => { const m = l.getScreenCTM(); const n = l.getTotalLength(); const a = l.getPointAtLength(0).matrixTransform(m), b = l.getPointAtLength(n).matrixTransform(m); const i = +l.getAttribute('data-node').slice(3).split('-')[0]; void i; void ends; return [a, b].every(q => [...svg.querySelectorAll('[data-node^="card-"][data-node$="-chip"]')].some(c => near(q, c.getBoundingClientRect()))); });
})()`;
// the enlarged focus card never covers another card or a relation label
const FOCUS_CLEAR = `(() => {
  const vis = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o > 0.3; };
  const cards = [...svg.querySelectorAll('[data-node^="card-"][data-node$="-chip"]')].filter(vis).map(e => e.getBoundingClientRect());
  const labels = [...svg.querySelectorAll('[data-node^="rel"][data-node$="-label"]')].filter(vis).map(e => e.getBoundingClientRect());
  const all = [...cards, ...labels];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i], b = all[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) return false; }
  return true;
})()`;
// relationship lines never cross a card they do not belong to (they run above the cards, outside the plan)
const LINES_CLEAR = `(() => {
  const lines = [...svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')];
  const cards = [...svg.querySelectorAll('[data-node^="card-"][data-node$="-chip"]')].map(e => e.getBoundingClientRect());
  const bld = svg.querySelector('[data-node="s-building"]').getBoundingClientRect();
  return lines.every(l => { const m = l.getScreenCTM(); const n = l.getTotalLength(); for (let t = 0.06; t < 0.94; t += 0.02) { const q = l.getPointAtLength(n * t).matrixTransform(m); if (q.x > bld.left + 2 && q.x < bld.right - 2 && q.y > bld.top + 2 && q.y < bld.bottom - 2) return false; if (cards.some(c => q.x > c.left + 3 && q.x < c.right - 3 && q.y > c.top + 3 && q.y < c.bottom - 3)) return false; } return true; });
})()`;

ratioChecks(ID, 'connectors end on their elements, clear of the plan and the cards; the focus card clear', [
  {at: [0.45, 1], tv: ['all'], dom: ENDS, label: 'rendered: every relationship line starts and ends on an element card'},
  {at: [0.45, 1], tv: ['all'], dom: LINES_CLEAR, label: 'rendered: relationship lines never run through the plan or across another card'},
  {at: times(0.44, 0.76, 0.02), tv: ['all'], dom: FOCUS_CLEAR, label: 'rendered: the enlarged focus card never covers another card or a relation label'},
  {at: [1], fn: 's.cardsClear && s.labelsClear && s.problems.length === 0', label: 'the composition fits without problems'},
  {at: times(0.44, 0.74, 0.02), fn: 's.tracer !== null', label: 'the tracer is shown throughout its window'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node^="badge"]', '[data-node="tracer"]', '[data-node="s-pmark"]', '[data-node="s-zmark"]']});
peopleSizeTest(ID, {names: ['p0', 'p1', 'p2', 'p3'], min: 60, step: 0.05});
equalWeightTest(ID, {chips: [['[data-node="card-publicSpace-chip"]', '[data-node="card-zone-chip"]']], marks: ['[data-node="s-pmark"]', '[data-node="s-zmark"]']});
wordingTest(ID);
noArrowsTest(ID);
coldCreateTest(ID);

fillMostTest(ID, {at: [0.05, 0.3, 0.6, 1]});
thinContentTest(ID);

// Relation labels are traceable (items 5 / 16; review model production/scratch/review-causation-05/labgap.mjs): at the
// hold every visible relation label is >= 20 px (1080p) nearer its own line than any other relationship line, and no
// other line passes under it. Every preset × ratio.
test(`${ID}: every relation label is >= 20 px nearer its own line than any other line, and no line passes under it`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready; x.seek(x.durationMs);
      const svg = x.element; const kk = 1080 / Math.min(w, h) / (svg.getBoundingClientRect().width / w);
      const lines = [...svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')];
      const pts = lines.map(l => { const M = l.getScreenCTM(); const L = l.getTotalLength(); const a = []; for (let s = 0; s <= 240; s++) { const q = l.getPointAtLength(L * s / 240); a.push(new DOMPoint(q.x, q.y).matrixTransform(M)); } return a; });
      for (const lab of svg.querySelectorAll('[data-node^="rel"][data-node$="-label"]')) {
        const i = +lab.getAttribute('data-node').slice(3).split('-')[0];
        const b = lab.getBoundingClientRect();
        const gap = arr => Math.min(...arr.map(p => Math.hypot(Math.max(b.left - p.x, 0, p.x - b.right), Math.max(b.top - p.y, 0, p.y - b.bottom))));
        const own = gap(pts[i]) * kk;
        const others = pts.filter((_, j) => j !== i);
        const other = others.length ? Math.min(...others.map(gap)) * kk : 1e9;
        if (!(other >= own + 20)) out.push(`${pr.name} ${ratio} rel${i} "${lab.textContent.slice(0, 24)}": own ${own.toFixed(1)} px, other ${other.toFixed(1)} px`);
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});
