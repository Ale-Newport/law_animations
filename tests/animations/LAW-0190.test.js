// LAW-0190 — Atención en registro · mechanism. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: every connector ends at its component, the traversal order does not change
// when seeking, and a plain relation is never drawn as causation (no arrowhead; causal only if supplied).
// Windows (LAW-0190.js W): components separate 0.02–0.16 · relationships drawn one by one 0.18–0.43 ·
// marker 0.45–0.73 (focus enlarges on its visit; rows take their supplied glyphs; slip printed when
// reached) · legend 0.76–0.83 · key 0.78–0.85.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {labelsOwnConnectors, NO_TEXT_ON_BARS, dense} from './atencion-en-registro-dom.js';

contractSuite('LAW-0190', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.separated === 0 && s.relationsDrawn.every(p => p === 0) && s.slipPrinted === 0 && s.dots.every(d => d === 0)', label: 'start: components clustered on the counter, nothing related, nothing marked'},
    {at: 0.17, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'separate: the components are laid out before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all relationships exist before the marker moves'},
    {at: 0.6, fn: "s.tracerVisible && JSON.stringify(s.visitOrder) === JSON.stringify(['filer', 'bundle', 'checklist', 'slip', 'filer'].slice(0, s.visitOrder.length)) && s.visitOrder.length >= 2", label: 'the marker follows the supplied traversal order'},
    {at: 0.6, fn: 's.focusScale > 1.1', label: 'the focus element (checklist) enlarges while the marker is on it'},
    {at: 1, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['filer', 'bundle', 'checklist', 'slip', 'filer']) && s.focusScale === 1 && s.legendShown === 1 && s.slipPrinted === 1 && s.dots.every(d => d === 1)", label: 'gather: full order visited, focus back to size, rows marked as supplied, slip printed, legend shown'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['filer', 'bundle', 'checklist', 'slip', 'filer'].slice(0, s.visitOrder.length))", label: 'seeking back (after the end) gives the same partial order'},
    {at: 1, fn: 's.connectorGaps.length > 0 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its component edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, params: {relationships: [{from: 'bundle', to: 'checklist', kind: 'causal', label: 'as supplied'}]}, fn: "s.arrows.length === 1 && s.arrows[0].kind === 'causal' && s.arrows[0].arrow", label: 'a causal link is drawn only when supplied'},
    {at: 1, params: {traversalOrder: ['clerk', 'checklist', 'slip']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['clerk', 'checklist', 'slip'])", label: 'a different traversal order is followed as supplied'},
    {at: 1, params: {props: {items: [{label: 'Filing form', status: 'received'}, {label: 'Cover letter', status: 'pending'}, {label: 'Annex 1 · site plan', status: 'received'}], reference: 'REF-0427 (fictional)', speech: {filer: 'I would like to file these documents.', clerk: 'Here is your entry reference.'}}}, fn: 's.rings[1] === 1 && s.dots[1] === 0 && s.dots[0] === 1', label: 'a row supplied as pending takes the dashed ring (as supplied)'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.visitOrder.length === 5 && s.slipPrinted === 1', label: 'the mechanism reads with labels hidden'},
  ],
});

suppliedTextSuite('LAW-0190', {
  fields: `const kinds = [...new Set(p.relationships.map(r => r.kind))];
    return [p.actors[0].name, p.actors[1].name, ...p.elements.map(e => e.label), ...p.props.items.map(i => i.label), p.props.reference, p.props.speech.filer,
      ...p.relationships.map(r => r.label), ...kinds.map(k => p.relationLabels[k])]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Tipos de relación (según lo aportado)'] : ['As supplied · no conclusion drawn', 'Relation kinds (as supplied)']`,
});

const TAIL_CLEAR = `(() => {
  const tail = svg.querySelector('[data-node="req-tail"]');
  if (!tail) return false;
  const m = tail.getScreenCTM(), L = tail.getTotalLength(), pts = [];
  for (let j = 0; j <= 60; j++) pts.push(tail.getPointAtLength((L * j) / 60).matrixTransform(m));
  const cx = pts.reduce((a, q) => a + q.x, 0) / pts.length, cy = pts.reduce((a, q) => a + q.y, 0) / pts.length;
  const inner = pts.map(q => ({x: (q.x + cx) / 2, y: (q.y + cy) / 2}));
  const eff = el => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none') return 0; o *= parseFloat(cs.opacity); } return o; };
  const cards = [...svg.querySelectorAll('[data-node^="lab-"], [data-node^="rl"][data-node$="g"], [data-node="legend"], [data-node="keyg"]')].filter(e => eff(e) > 0.05);
  return cards.every(c => { const b = c.getBoundingClientRect(); return ![...pts, ...inner].some(q => q.x > b.left + 1 && q.x < b.right - 1 && q.y > b.top + 1 && q.y < b.bottom - 1); });
})()`;
ratioChecks('LAW-0190', 'layout fits; labels beside their own connectors; connectors distinct', [
  {at: [1], fn: 's.labelsFit && s.crossings === 0 && s.relLabelMaxDist <= 40', label: 'components and labels fit; no connector crossings; every relation label within 40 px of its line', tv: ['all']},
  {at: [1], fn: 's.labelsFit && s.crossings === 0', label: 'components fit without labels too', tv: ['none']},
  {at: [0.46, 0.55, 0.62, 0.7], fn: 's.tracerVisible', label: 'the marker is visible while it travels'},
  {at: [1], dom: labelsOwnConnectors('rl', 'rg-c'), label: "rendered: each relation label's nearest connector is its own (≤ 40 px, others ≥ 8 px further)", tv: ['all']},
  {at: dense(0, 1, 0.025), dom: NO_TEXT_ON_BARS, label: 'rendered: no visible text lands on a visible placeholder bar'},
  // review repair: the people keep one size in every preset; the marker never rests on a face; the empty slip
  // slot is labelled; no chip, label, legend or key lies on the request bubble's tail
  {at: [1], ratios: ['1:1'], fn: 's.peopleDiameter >= 115', label: '1:1: the people badges keep the baseline size in every preset (≥ 115 design px across)'},
  {at: [1], ratios: ['16:9'], fn: 's.peopleDiameter >= 161', label: '16:9: the people badges keep the baseline size in every preset'},
  {at: [1], ratios: ['9:16'], fn: 's.peopleDiameter >= 170', label: '9:16: the people badges keep the baseline size in every preset'},
  {at: dense(0.44, 0.76, 0.004), fn: 's.tracerClearOfFaces', label: 'the marker never sits on a face (people are visited at their badge rim)'},
  {at: [0.3], fn: 's.slotLabelled', label: 'the empty slip slot carries a label until the slip is printed', tv: ['all']},
  {at: [0.2, 0.5, 1], dom: TAIL_CLEAR, label: "rendered: no chip, relation label, legend or key covers the request bubble's tail"},
]);
