// LAW-0698 — Daño material · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element (anchored to the element's edge; the inset relation ends
// ON the altered spot of the after state), the order does not change when seeking (the tracer follows the supplied
// traversal order along the drawn connectors) and a plain relation is never drawn as causation (no head on a relation;
// a causal arrow only where the author supplied kind "causal").
// Windows (LAW-0698.js W): split 0.02–0.16 · inset opens 0.12–0.18 · labels 0.12–0.19 · connectors 0.19–0.42 (one
// after another) · tracer 0.46–0.73 · focus in 0.45–0.52, out 0.74–0.80 · key 0.78–0.84 (hold ≥ 1100 ms).
// coordinator decision 2026-09-26 (standing stress cap rule, AUTHORING item 20; LAW-0687/0689–0692 precedent; see
// SESSION_HANDOFF): after trying the fallback layouts, the long-labels-stress entry COUNT is capped at 4 (baseline 3) with
// every text at near-maximum length (measurements in LAW-0698.presets.json); every field stays longer than the baseline.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, frameShare, coldCreate} from './dano-material-checks.js';

const ID = 'LAW-0698';
const P = name => presetsFor(ID).find(q => q.name === name).params;
// connector ends lie on (within 16 units of) the edge of their element's box — or, for the inset relation, on the spot
const ANCHORED = "s.linkEnds.every(l => [['from', l.a], ['to', l.b]].every(([k, pt]) => { const id = l[k]; if (id === 'after' && (l.from === 'detail' || l.to === 'detail')) return Math.hypot(pt.x - s.spot.x, pt.y - s.spot.y) < 1; const b = s.boxes[id]; if (!b) return false; if (id === 'detail') { const cx = b.x + b.w / 2, cy = b.y + b.h / 2, d = Math.hypot(pt.x - cx, pt.y - cy); return d > b.w / 2 - 1 && d < b.w / 2 + 16; } const dx = Math.max(b.x - pt.x, 0, pt.x - b.x - b.w), dy = Math.max(b.y - pt.y, 0, pt.y - b.y - b.h); return Math.hypot(dx, dy) <= 16 && !(pt.x > b.x + 1 && pt.x < b.x + b.w - 1 && pt.y > b.y + 1 && pt.y < b.y + b.h - 1); }))";

contractSuite(ID, {
  continuity: ['before', 'after', 'tracer'],
  semantic: [
    {at: 0, fn: 's.split === 0 && s.drawn.every(d => d === 0)', label: 'start: one object in the middle, no connector yet'},
    {at: 0.18, fn: 's.split === 1 && s.drawn.every(d => d === 0)', label: 'separate: the two states stand apart before any relationship is drawn'},
    {at: 0.3, fn: 's.drawn[0] === 1 && s.drawn[s.drawn.length - 1] < 1', label: 'relationships are drawn one after another'},
    {at: 0.43, fn: 's.drawn.every(d => d === 1)', label: 'every supplied relationship is drawn by 0.43'},
    {at: 0.6, fn: 's.tracerOn > 0 && s.focus > 1', label: 'the tracer runs while the focus element is enlarged'},
    {at: 1, fn: `s.keyShown && s.focus === 1 && s.tracerOn === 0 && !s.causalShown && s.kinds.includes('relation') && ${ANCHORED}`, label: 'hold: every connector ends on its element; no causal arrow by default; key shown'},
    {at: 1, fn: "s.kinds.every((k, i) => (k === 'relation') === !s.arrows[i])", label: 'a plain relation never gets an arrowhead'},
    {at: 1, params: P('contrast-or-alternative'), fn: `s.causalShown && s.kinds.filter(k => k === 'causal').length === 1 && ${ANCHORED}`, label: 'alternative: exactly the one causal link the author supplied is drawn as causal'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.split === 1 && s.drawn.every(d => d === 1)', label: 'labels hidden: the same separation and relationships'},
  ],
});

ratioChecks(ID, 'layout, anchoring and traversal', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
  {at: [1], fn: ANCHORED, label: 'every connector ends on its element'},
  {at: [1], tv: ['all'], fn: '!s.labelClash', label: 'every relation label found a place clear of the elements, chips, other labels and connectors'},
  {at: [0.5, 0.6, 0.7], fn: "s.legs.length >= 1 && s.leg >= 0", label: 'the tracer is on a leg of the supplied traversal order'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, scene share', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: frameShare(['el-before', 'el-after', 'el-detail', 'el-events', 'stands'], 0.55, 0.55), label: 'the model (states, inset, record) spans >= 55 % of the frame width or height'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.object.before, ...p.elements.map(e => e.label)]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), p.object.before]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5);
textSizeOverTime(ID);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Incident|Object|record|before|after|supplied|conclusion|Altered|Link|then|part of)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

coldCreate(ID);

// Rendered (reviewer model: production/scratch/review-causation-05/labgap.mjs): every relation label sits beside its
// OWN connector — ≤ 24 px at 1080p from its line — and nearer to it than to any other connector, at the hold and while
// the tracer runs, in every preset × ratio (labels shown).
ratioChecks(ID, 'relation labels attached to their own connector (rendered)', [
  {at: [0.6, 1], tv: ['all'], dom: `(() => {
    const m0 = svg.getScreenCTM(), vb = svg.viewBox.baseVal, k = 1080 / Math.min(vb.width, vb.height) / Math.abs(m0.a);
    const lines = [...svg.querySelectorAll('[data-node$="-line"][data-node^="lk"]')];
    const dist = (path, lb) => { const M = path.getScreenCTM(), L = path.getTotalLength(); let best = 1e9; for (let s = 0; s <= 80; s++) { const q = path.getPointAtLength(L * s / 80); const p = new DOMPoint(q.x, q.y).matrixTransform(M); const dx = Math.max(lb.left - p.x, 0, p.x - lb.right), dy = Math.max(lb.top - p.y, 0, p.y - lb.bottom); best = Math.min(best, Math.hypot(dx, dy)); } return best * k; };
    const labs = [...svg.querySelectorAll('[data-node^="lkl"]')];
    if (!labs.length) return false;
    return labs.every(lab => {
      const i = lab.getAttribute('data-node').slice(3);
      const own = svg.querySelector('[data-node="lk' + i + '-line"]');
      const lb = lab.getBoundingClientRect();
      const d = dist(own, lb);
      return d <= 24 && lines.every(o => o === own || dist(o, lb) > d);
    });
  })()`, label: 'each relation label is <= 24 px (1080p) from its own connector and nearer to it than to any other connector'},
]);
