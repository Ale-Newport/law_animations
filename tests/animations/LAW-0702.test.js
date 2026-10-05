// LAW-0702 — Pérdida económica · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the model is spatial (two equal balance columns on equal stands, the flow record and a round
// inset of the stated gap), only the supplied relationships are drawn with their kind (a causal arrow only when
// supplied), and the tracer follows the supplied traversal order.
// Windows (LAW-0702.js W): split 0.02–0.16 · inset opens 0.12–0.18 · connectors 0.19–0.42 (one after another) · tracer
// and focus 0.43–0.75 · key 0.76–0.82.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; subject >= 0.20 of the frame height,
// causation-05 LAW-0700 decision in production/SESSION_HANDOFF.md): the long-labels-stress COUNTS are capped; true
// driver, fallbacks tried and rendered before/after numbers in LAW-0702.presets.json.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, frameShare, coldCreate, restHoldFill, thinContent, subjectHeight, inFrameSweep} from './perdida-economica-checks.js';

const ID = 'LAW-0702';
const P = name => presetsFor(ID).find(q => q.name === name).params;
// every connector ends on (or at the rim of) its element; the inset → alleged link ends on the gap spot of the ◆ column
const ANCHORED = "s.linkEnds.every(l => [['from', l.a], ['to', l.b]].every(([k, pt]) => { const id = l[k]; if (id === 'alleged' && (l.from === 'difference' || l.to === 'difference')) return Math.hypot(pt.x - s.spot.x, pt.y - s.spot.y) < 1; const b = s.boxes[id]; if (!b) return false; if (id === 'difference') { const cx = b.x + b.w / 2, cy = b.y + b.h / 2, d = Math.hypot(pt.x - cx, pt.y - cy); return d > b.w / 2 - 1 && d < b.w / 2 + 16; } const dx = Math.max(b.x - pt.x, 0, pt.x - b.x - b.w), dy = Math.max(b.y - pt.y, 0, pt.y - b.y - b.h); return Math.hypot(dx, dy) <= 16 && !(pt.x > b.x + 1 && pt.x < b.x + b.w - 1 && pt.y > b.y + 1 && pt.y < b.y + b.h - 1); }))";

contractSuite(ID, {
  continuity: ['reference', 'alleged', 'tracer'],
  semantic: [
    {at: 0, fn: 's.split === 0 && s.drawn.every(d => d === 0)', label: 'start: one column in the middle, no connector yet'},
    {at: 0.18, fn: 's.split === 1 && s.drawn.every(d => d === 0)', label: 'separate: the two columns stand apart before any relationship is drawn'},
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
  {at: [0.5, 0.6, 0.7], fn: 's.legs.length >= 1 && s.leg >= 0', label: 'the tracer is on a leg of the supplied traversal order'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, scene share', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: frameShare(['el-reference', 'el-alleged', 'el-difference', 'el-record', 'stands'], 0.55, 0.55), label: 'the model (columns, inset, record) spans >= 0.55 of the frame width or height'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), ...p.elements.map(e => e.label)]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Flow|record|Reference|Alleged|Stated|supplied|conclusion|units|fictional|Link|then|related)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

// Rendered: every relation label sits beside its OWN connector — ≤ 24 px at 1080p from its line — and nearer to it than
// to any other connector, at the hold and while the tracer runs, in every preset × ratio (labels shown).
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

ratioChecks(ID, 'no red for the loss (rendered)', [
  {at: [0.3, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent', presets: ['baseline-illustrative', 'baseline-es', 'long-labels-stress']},
]);

restHoldFill(ID, [0.2, 1]);
thinContent(ID);
// the subject: each balance column on its stand
subjectHeight(ID, [['ob', 'st-reference'], ['oa', 'st-alleged']], [0.2, 1]);
coldCreate(ID);
inFrameSweep(ID);

// Rendered (review 2026-09-27: the inset → alleged connector crossed the record card at 1:1): no connector passes
// through an element box (record, columns, inset) or a caption chip it does not join, at the hold and while tracing.
ratioChecks(ID, 'no connector through a card or element it does not join (rendered)', [
  {at: [0.5, 1], dom: `(() => {
    const els = {};
    // (the inset is a disc: its clipped copy inflates the group's box, so the disc itself is used)
    const disc = e => { const c = e.querySelector('circle'); const b = c.getBoundingClientRect(); return {disc: true, cx: b.left + b.width / 2, cy: b.top + b.height / 2, r: b.width / 2}; };
    for (const id of ['record', 'reference', 'alleged', 'difference', 'alternative']) { const e = svg.querySelector('[data-node="el-' + id + '"]'); if (e && e.getBoundingClientRect().width > 0) els[id] = [id === 'difference' ? disc(e) : e.getBoundingClientRect()]; }
    for (const id of ['reference', 'alleged', 'difference', 'alternative']) { const c = svg.querySelector('[data-node="el-lab-' + id + '"]'); if (c && c.getBoundingClientRect().width > 0) (els[id] = els[id] || []).push(c.getBoundingClientRect()); }
    const ends = [...svg.querySelectorAll('[data-node^="lk"][data-node$="-line"]')];
    return ends.every(p => {
      const own = (p.closest('[data-link]') || p).getAttribute('data-link');
      const M = p.getScreenCTM(), Lt = p.getTotalLength();
      return Object.entries(els).every(([id, boxes]) => {
        if (own && own.split('>').includes(id)) return true;
        return boxes.every(B => { for (let t = 0.05; t <= 0.95; t += 0.01) { const q = p.getPointAtLength(Lt * t); const P = new DOMPoint(q.x, q.y).matrixTransform(M); if (B.disc ? Math.hypot(P.x - B.cx, P.y - B.cy) < B.r - 3 : (P.x > B.left + 3 && P.x < B.right - 3 && P.y > B.top + 3 && P.y < B.bottom - 3)) return false; } return true; });
      });
    });
  })()`, label: 'no connector passes through a card, element or caption chip it does not join'},
]);

// locale "es" with the default content (review 2026-09-27): the default events, stated difference and captions are
// drawn in Spanish too (fields left at their English default take their Spanish default)
ratioChecks(ID, 'locale es with default params draws no English', [
  {at: [0.1, 0.62, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Month|Shop|Supplier|Flow|record|Reference|Alleged|Stated|supplied|conclusion|units|fictional|Before|After|Changed|Only|Same|Hopper|gate|related)\\b/.test(t.textContent))", label: 'no English text with locale es and default params'},
]);
