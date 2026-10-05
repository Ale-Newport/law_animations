// LAW-0198 — Reunión de equipo jurídico · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking,
// and a relation is never drawn as causality by default.
// Windows (LAW-0198.js): separate 0.02–0.15 · connectors drawn one by one 0.20–0.42 · tracer 0.45–0.72 along the
// supplied order (7 steps of 0.0386: a's magnet lands at u 0.566, b's at 0.643, c's at 0.72) · gather.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0198';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';
const FULL_A = "['file','board','a','t1','b','t2','c','t3']";
const FULL = `JSON.stringify(${FULL_A})`;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.slide === 0 && s.filled.every(v => v === 0)', label: 'separate: components together; nothing related or filled yet'},
    {at: 0.18, fn: 's.slide === 1 && s.relationsDrawn.every(p => p === 0)', label: 'components are in place before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible && s.filled.every(v => v === 0)', label: 'all supplied relationships exist before the tracer moves; no slot filled yet'},
    {at: 0.6, fn: `JSON.stringify(s.filled) === '[1,0,0]' && ${ORDER} === JSON.stringify(${FULL_A}.slice(0, s.visitOrder.length))`, label: 'the first name magnet stays in its card slot; visits follow the supplied order'},
    {at: 1, fn: `JSON.stringify(s.filled) === '[1,1,1]' && ${ORDER} === ${FULL} && !s.tracerVisible`, label: 'gather: every supplied link delivered, visits in the supplied order'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back restarts the order (nothing visited before the trace beat)'},
    {at: 1, fn: 's.connectorGaps.length === 4 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.causalCount === 0", label: 'plain relations have no arrowhead; nothing causal unless supplied'},
    {at: 0.604, fn: "s.focus === 'b' && s.focusScale > 1.05", label: 'the focus element enlarges while the tracer passes'},
    {at: 1, fn: 's.labelsClear && s.labelsFit', label: 'labels clear of each other and of the components; layout fits'},
    {at: 1, params: {relationships: [{from: 'file', to: 'board', kind: 'causal', label: 'as supplied'}, {from: 'a', to: 't1', kind: 'relation', label: ''}]}, fn: "s.causalCount === 1 && s.arrows[0].arrow && JSON.stringify(s.filled) === '[1,0,0]'", label: 'a causal link appears only when supplied; an unlinked card keeps its empty slot'},
    {at: 1, params: P('contrast-or-alternative'), fn: `JSON.stringify(s.filled) === '[1,0,1]' && ${ORDER} === JSON.stringify(['file','board','c','t3','a','t1'])`, label: 'alternative: two links, the middle slot stays empty, the order is followed as supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.filled) === '[1,1,1]' && s.relationsDrawn.every(p => p === 1)", label: 'labels hidden: the same map and deliveries'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const kinds = [...new Set(p.relationships.filter(q => !q.label).map(q => q.kind))]; return [...p.actors.map(a => a.name), p.roles.a, p.roles.b, p.roles.c, ...p.props.tasks, p.props.speech, ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label), ...kinds.map(k => p.relationLabels[k])];",
  content: 'return [...p.actors.map(a => a.name), ...p.props.tasks, ...p.elements.map(e => e.label)];',
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

ratioChecks(ID, 'labels clear, tracer never under a label or face', [
  {at: [1], fn: 's.labelsClear && s.labelsFit', label: 'labels clear; layout fits'},
  {at: times(0.45, 0.72, 0.01), fn: '!s.tracerOnLabel && !s.tracerOnFace', label: 'the tracer never passes under a relation label or a face'},
]);

// Rendered, every preset × ratio at the hold: each relation label's nearest connector is its own (≤ 40 px at
// 1080p, any other ≥ 8 px further) — same check as the accepted LAW-0178.
const OWN_NEAREST = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const conns = [];
  for (const path of svg.querySelectorAll('[data-node^="rg-c"][data-node$="-line"]')) {
    const i = +path.getAttribute('data-node').match(/^rg-c(\\d+)-line$/)[1];
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 160; j++) pts.push(path.getPointAtLength((L * j) / 160).matrixTransform(m));
    conns[i] = pts;
  }
  const labels = [...svg.querySelectorAll('[data-node^="rg-lg"]')].filter(e => visible(e));
  if (!labels.length) return false;
  for (const lab of labels) {
    const i = +lab.getAttribute('data-node').slice(5);
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
// Rendered connector routing (LAW-0178 rules): no connector through a portrait or the case file other than at its
// own ends; ends and arrowheads clear of text; connectors sharing an element leave it from distinct points; no two
// connectors run within 20 px of each other for more than 120 px.
const ROUTES_CLEAN = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const bodies = [...svg.querySelectorAll('[data-node^="body-"]')].filter(e => visible(e)).map(e => {
    const r = e.getBoundingClientRect();
    const circle = !/file/.test(e.getAttribute('data-node'));
    return {id: e.getAttribute('data-node').slice(5), circle, cx: r.left + r.width / 2, cy: r.top + r.height / 2, rad: Math.min(r.width, r.height) / 2, r};
  });
  const inBody = (q, b, pad) => b.circle ? Math.hypot(q.x - b.cx, q.y - b.cy) < b.rad - pad : q.x > b.r.left + pad && q.x < b.r.right - pad && q.y > b.r.top + pad && q.y < b.r.bottom - pad;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect());
  const inText = (q, pad) => texts.some(r => q.x > r.left - pad && q.x < r.right + pad && q.y > r.top - pad && q.y < r.bottom + pad);
  const lines = [...svg.querySelectorAll('[data-node^="rg-c"][data-node$="-line"]')].filter(e => visible(e) && e.getTotalLength() > 0).map(path => {
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 120; j++) pts.push(path.getPointAtLength((L * j) / 120).matrixTransform(m));
    const name = path.getAttribute('data-node').replace('-line', '');
    const head = svg.querySelector('[data-node="' + name + '-head"]');
    return {name, pts, len: L * m.a, head: head && visible(head) ? head.getBoundingClientRect() : null};
  });
  for (const ln of lines) {
    for (const q of ln.pts.slice(8, 113)) for (const b of bodies) if (inBody(q, b, 3 * k)) return false;
    if ([ln.pts[0], ln.pts[120]].some(q => inText(q, 4 * k))) return false;
    if (ln.head) { const c = {x: (ln.head.left + ln.head.right) / 2, y: (ln.head.top + ln.head.bottom) / 2}; if (inText(c, 4 * k)) return false; }
  }
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const a = lines[i], b = lines[j];
    for (const p of [a.pts[0], a.pts[120]]) for (const q of [b.pts[0], b.pts[120]]) if (Math.hypot(p.x - q.x, p.y - q.y) < 12 * k) return false;
    const step = a.len / 120;
    let run = 0;
    for (const q of a.pts) {
      const close = b.pts.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 20 * k);
      run = close ? run + step : 0;
      if (run > 120 * k) return false;
    }
  }
  return true;
})()`;
ratioChecks(ID, 'labels beside their own connectors; connectors routed cleanly (rendered)', [
  {at: [1], tv: ['all'], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (≤ 40 px at 1080p, others ≥ 8 px further)"},
  {at: [1], dom: ROUTES_CLEAN, label: 'rendered: no connector through a portrait or the file, ends/arrowheads clear of text, distinct attachments, no close parallels'},
]);
