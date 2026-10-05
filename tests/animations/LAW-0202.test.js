// LAW-0202 — Distribución de una sala · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when
// seeking, and a plain relation is never drawn as causality by default.
// Timing (u): separate 0.02–0.15; relationships drawn one by one 0.20–0.42; tracer 0.45–0.72 (the
// participant walks so that they sit as the tracer reaches the seat; the sheet's rows turn face up
// when the tracer reaches the sheet); legend and key 0.75–0.81; still from 0.81.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0202';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';

contractSuite(ID, {
  continuity: ['tracer', 'person'],
  attach: [{from: 0.76, to: 1, a: 'person', b: 'seatAt', tol: 0.5}],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.slide === 0 && s.sheetRevealed === 0', label: 'separate: parts start together; no relationship drawn; labels face down'},
    {at: 0.18, fn: 's.slide === 1 && s.relationsDrawn.every(p => p === 0)', label: 'the parts are in place before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.435, fn: "s.relationsDrawn.every(p => p === 1) && !s.tracerVisible && s.personState === 'waiting'", label: 'all supplied relationships exist before the tracer moves; the participant still waits'},
    {at: 0.5, fn: `${ORDER} === JSON.stringify(['building'])`, label: 'the tracer starts at the first supplied component'},
    {at: 1, fn: `${ORDER} === JSON.stringify(['building','room','entrance','seat','label']) && s.sheetRevealed === 1 && s.personState === 'seated'`, label: 'the tracer followed the supplied order; the participant is seated; the labels are revealed'},
    {at: 0.3, fn: `${ORDER} === '[]' && s.sheetRevealed === 0`, label: 'seeking back: the order restarts and the labels are face down again'},
    {at: 0.6, fn: 's.sheetRevealed === 0', label: 'the labels are revealed only when the tracer reaches the sheet'},
    {at: 1, fn: 's.connectorGaps.length === 4 && s.connectorGaps.every(g => g <= 10)', label: 'every connector ends at its element edge (arrowheads touch their part)'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 0.66, fn: 's.focusScale > 1.1', label: 'the focus element (the seat) enlarges while the tracer passes'},
    {at: 1, params: {traversalOrder: ['label', 'seat', 'entrance']}, fn: `${ORDER} === JSON.stringify(['label','seat','entrance'])`, label: 'a different supplied order is followed as supplied'},
    {at: 1, params: P('contrast-or-alternative'), fn: `${ORDER} === JSON.stringify(['participant','entrance','seat','label']) && s.personState === 'seated'`, label: 'alternative: the tracer starts at the participant'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.relationsDrawn.every(p => p === 1) && s.personState === 'seated' && s.sheetRevealed === 1", label: 'labels hidden: the same map, walk and reveal'},
    {at: 1, fn: 's.problems.length === 0 && s.labelsClear && s.labelOwn && s.tracerParkedClear', label: 'layout: labels clear and beside their own connectors; tracer parked clear'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const kinds = [...new Set(p.relationships.map(q => q.kind))]; return [p.courts.building, p.courts.room, ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label || p.relationLabels[q.kind]), ...kinds.map(k => p.relationLabels[k]), ...p.seats.map(s => s.label), p.labels.mainDoor, p.labels.sideDoor, p.labels.key];",
  content: "return [p.courts.building, p.courts.room, ...p.elements.map(e => e.label), ...p.seats.map(s => s.label)];",
  captions: "const kinds = [...new Set(p.relationships.map(q => q.kind))]; return [...kinds.map(k => p.relationLabels[k]), p.labels.sideDoor];",
});

// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
// each relation label's nearest connector is its own (<= 40 px), others >= 8 px further (LAW-0178 rule)
const OWN_NEAREST = `(() => { ${K}
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
    const r0 = lab.getBoundingClientRect();
    const b = {l: r0.left, t: r0.top, r: r0.right, b: r0.bottom};
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b)))) / K;
    const own = dist(conns[i]);
    if (own > 40) return false;
    for (const [j, pts] of conns.entries()) if (pts && j !== i && dist(pts) < own + 8) return false;
  }
  return true;
})()`;
// connectors routed cleanly: none passes through any text (other than at its two ends), none through the
// seated person's head; connectors sharing an element leave it from distinct points; no close parallel runs
const ROUTES_CLEAN = `(() => { ${K}
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect());
  const head = svg.querySelector('[data-node="walker-head"]').getBoundingClientRect();
  const lines = [...svg.querySelectorAll('[data-node^="rg-c"][data-node$="-line"]')].filter(e => visible(e) && e.getTotalLength() > 0).map(path => {
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 120; j++) pts.push(path.getPointAtLength((L * j) / 120).matrixTransform(m));
    return {pts, len: L * m.a};
  });
  const inR = (q, r, pad) => q.x > r.left - pad && q.x < r.right + pad && q.y > r.top - pad && q.y < r.bottom + pad;
  for (const ln of lines) {
    for (const q of ln.pts.slice(4, 117)) {
      if (texts.some(r => inR(q, r, 2 * K))) return false;
      if (inR(q, head, 0)) return false;
    }
  }
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const a = lines[i], b = lines[j];
    for (const p of [a.pts[0], a.pts[120]]) for (const q of [b.pts[0], b.pts[120]]) if (Math.hypot(p.x - q.x, p.y - q.y) < 12 * K) return false;
    const step = a.len / 120;
    let run = 0;
    for (const q of a.pts) {
      const close = b.pts.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 20 * K);
      run = close ? run + step : 0;
      if (run > 120 * K) return false;
    }
  }
  return true;
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const PERSON_SIZE = `(() => { ${K} const hd = svg.querySelector('[data-node="walker-head"]').getBoundingClientRect(); const pb = svg.querySelector('[data-node="walker"]').getBoundingClientRect(); return hd.width / K >= 26 && pb.width / K >= 60; })()`;

// the "separate" beat never stacks the parts: building, room (with its seat and entrance), participant and label
// sheet (each with its caption) stay clear of one another from the first frame
const PARTS_CLEAR = `(() => {
  const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; };
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  // members: each part's drawing and its caption (the direct children of the element groups)
  const kids = e => (e ? [...e.children].filter(c => { const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) : []);
  const groups = [[q('el-building')], [q('el-room'), q('el-seat'), q('el-entrance')], [q('el-participant')], [q('el-label')]].map(g => g.flatMap(kids).map(bx));
  const hit = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
  return groups.every((ga, i) => groups.every((gb, j) => j <= i || ga.every(a => gb.every(b => !hit(a, b)))));
})()`;
// element captions lie on no furniture (desk, tables, bench, plants, chairs other than the traced seat's own)
const CAPTIONS_OFF_FURNITURE = `(() => {
  const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; };
  const caps = [...svg.querySelectorAll('[data-node^="cap-"]')].filter(e => visible(e)).map(bx);
  const seat = svg.querySelector('[data-node="walker"]');
  const sb = seat ? bx(seat) : null;
  const furn = [...svg.querySelectorAll('[data-node]')].filter(e => /^rm-(desk|table\\d|bench|plant\\d|chair-\\w+)$/.test(e.getAttribute('data-node'))).map(bx)
    .filter(f => !sb || !((f.l + f.r) / 2 > sb.l && (f.l + f.r) / 2 < sb.r && (f.t + f.b) / 2 > sb.t && (f.t + f.b) / 2 < sb.b));
  return caps.every(c => furn.every(f => !(c.l < f.r - 3 && f.l < c.r - 3 && c.t < f.b - 3 && f.t < c.b - 3)));
})()`;

ratioChecks(ID, 'labels own their connectors, clean routes, tracer parked, scene fills the frame', [
  {at: times(0, 0.12, 0.02), dom: PARTS_CLEAR, label: 'rendered: the separate beat starts with the parts apart (no part or caption stacked on another)'},
  {at: [0, 1], tv: ['all'], dom: CAPTIONS_OFF_FURNITURE, label: 'rendered: element captions lie on no furniture'},
  {at: [1], tv: ['all'], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (<= 40 px), others >= 8 px further"},
  {at: [1], dom: ROUTES_CLEAN, label: 'rendered: connectors cross no text or head, leave shared parts from distinct points, never run in close parallel'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems (labels, sheet, legend, frame)'},
  {at: [0.73, 0.8, 1], fn: '!s.tracerVisible && s.tracerParkedClear', label: 'the tracer is gone at the hold (never parked over text)'},
  {at: times(0.45, 0.72, 0.03), fn: 's.tracerParkedClear', label: 'the tracer never shows over the label sheet'},
  {at: [1], dom: FILL, label: 'rendered: the scene fills the caption-safe box (labels shown and hidden)'},
  {at: [0, 1], dom: PERSON_SIZE, label: 'rendered: the participant >= 60 px across, head >= 26 px'},
]);
