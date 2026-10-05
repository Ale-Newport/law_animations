// LAW-0162 — Entrevista a cliente · mechanism. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: every connector ends at its element, the order
// does not change when seeking, and a plain relation is never drawn as causation.
// Windows (LAW-0162.js W): components slide out 0.03–0.16, relationships drawn
// 0.18–0.43 (one by one), tracer 0.45–0.72, legend and key 0.76–0.84.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

// Rendered check (round-2 review): every relation label's nearest connector is its OWN, within 40 px
// (at 1080p) and at least 8 px closer than any other connector. Label i = group [data-node="rl<i>"]
// (its chip shapes and text; the dotted leader line is excluded), connector i = path [data-node="rgp-c<i>-line"], sampled along its length.
const OWN_NEAREST = `(() => {
  // screen px per 1080p px: the root's screen scale × (viewBox units per 1080p px)
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const conns = [];
  for (const path of svg.querySelectorAll('[data-node^="rgp-c"][data-node$="-line"]')) {
    const i = +path.getAttribute('data-node').match(/^rgp-c(\\d+)-line$/)[1];
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 160; j++) pts.push(path.getPointAtLength((L * j) / 160).matrixTransform(m));
    conns[i] = pts;
  }
  const labels = [...svg.querySelectorAll('[data-node^="rl"]')].filter(e => /^rl\\d+$/.test(e.getAttribute('data-node')));
  if (!labels.length) return false;
  for (const lab of labels) {
    const i = +lab.getAttribute('data-node').slice(2);
    const rs = [...lab.querySelectorAll('path,rect,text')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    if (!rs.length || !conns[i]) return false;
    const b = {l: Math.min(...rs.map(r => r.left)), t: Math.min(...rs.map(r => r.top)), r: Math.max(...rs.map(r => r.right)), b: Math.max(...rs.map(r => r.bottom))};
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b)))) / k;
    const own = dist(conns[i]);
    if (own > 40) return false;
    for (const [j, pts] of conns.entries()) if (pts && j !== i && dist(pts) < own + 8) return false;
  }
  return true;
})()`;

contractSuite('LAW-0162', {
  continuity: ['tracer'],
  continuityLimit: 45,
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.separated === 0 && s.relationsDrawn.every(p => p === 0)', label: 'start: people at the table, components not yet separated, nothing related'},
    {at: 0.17, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'separate: the components are laid out before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.42, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all relationships exist before the marker moves'},
    {at: 0.6, fn: "s.tracerVisible && JSON.stringify(s.visitOrder) === JSON.stringify(['interviewer','questions','client'].slice(0, s.visitOrder.length)) && s.visitOrder.length >= 2", label: 'the marker follows the supplied traversal order'},
    {at: 0.73, fn: 's.focusScale > 1.1', label: 'the focus element (clarified detail) enlarges while the marker passes'},
    {at: 1, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['interviewer','questions','client','account','client','detail']) && s.focusScale === 1 && s.legendShown === 1", label: 'gather: full order visited, focus back to size, legend shown'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['interviewer','questions','client'].slice(0, s.visitOrder.length))", label: 'seeking back (after the end) gives the same partial order'},
    {at: 1, fn: 's.connectorGaps.length > 0 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, params: {relationships: [{from: 'client', to: 'account', kind: 'causal', label: 'as supplied'}]}, fn: "s.arrows.length === 1 && s.arrows[0].kind === 'causal' && s.arrows[0].arrow", label: 'a causal link is drawn only when supplied'},
    {at: 1, params: {traversalOrder: ['client', 'detail']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['client', 'detail'])", label: 'a different traversal order is followed as supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.visitOrder.length === 6', label: 'the mechanism reads with labels hidden'},
    // review fix (item 14): editing \`roles\` changes the drawn role text
    {at: 1, params: {roles: {client: 'Test role C', interviewer: 'Test role I'}}, fn: "s.nameTexts[0].includes('Test role C') && s.nameTexts[1].includes('Test role I')", label: 'roles drive the role text drawn beside each person'},
    // review fix (equal weight): after the trace the marker and every ring fade, so both people end equal
    {at: 1, fn: '!s.tracerShown && s.ringsVisible.length === 0', label: 'the hold is neutral: no marker or ring left on either person'},
  ],
});

suppliedTextSuite('LAW-0162', {
  fields: `const lab = id => p.elements.find(e => e.id === id).label;
    const kinds = [...new Set(p.relationships.map(r => r.kind))];
    return [p.actors[0].name, p.actors[1].name, ...p.elements.map(e => e.label), p.props.account, p.props.question, p.props.clarification,
      ...p.relationships.map(r => r.label), ...kinds.map(k => p.relationLabels[k])]`,
  // review fix: relation labels and the legend of kinds are held to the same size floor (≥ 16 px, ≥ 19.5 baseline)
  content: `const kinds = [...new Set(p.relationships.map(r => r.kind))];
    return [p.actors[0].name, p.actors[1].name, ...p.elements.map(e => e.label), p.props.account, p.props.question, p.props.clarification,
      ...p.relationships.map(r => r.label), ...kinds.map(k => p.relationLabels[k])]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión'] : ['As supplied · no conclusion drawn']`,
});

ratioChecks('LAW-0162', 'layout fits; labels beside their connectors; connectors distinct and readable', [
  {at: [1], fn: 's.labelsFit && s.labelsClear', label: 'components, names and legend fit; relation labels clear of elements', tv: ['all']},
  // review fixes: labels never sit on (or stack over) any connector; connectors never cross, never run
  // under a name chip and are long enough to read (≥ 70 px)
  {at: [1], fn: 's.labelsOffConnectors && s.crossings === 0 && s.connectorsClearOfChips && s.minConn >= 70', label: 'labels off every connector; no crossings; connectors clear of name chips and ≥ 70 px'},
  {at: [1], fn: '!s.tracerShown && s.ringsVisible.length === 0', label: 'neutral hold: no marker or ring on either person'},
  // round-2 fixes: each relation label beside its own connector, never ambiguous (layout + rendered)
  {at: [1], fn: 's.relLabelsUnambiguous && s.relLabelCount === 4 && s.relLabelMaxDist <= 40', label: 'every relation label within 40 px of its own connector, others ≥ 16 px further', tv: ['all']},
  {at: [1], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (≤ 40 px, others ≥ 8 px further)", tv: ['all']},
  // round-2 fix: the detail card's text never runs under its folded corner
  {at: [1], fn: 's.detailTextClearOfFold', label: 'the detail card text keeps clear of the folded corner', tv: ['all']},
]);
