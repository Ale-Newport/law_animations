// LAW-0178 — Representación de una parte · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change
// when seeking, and a relation is never drawn as causality by default.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const P = name => presetsFor('LAW-0178').find(q => q.name === name).params;
const ORDER = "JSON.stringify(s.visitOrder)";

contractSuite('LAW-0178', {
  continuity: ['tracer'],
  continuityLimit: 70,
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.slide === 0', label: 'separate: components start together; no relationship drawn yet'},
    {at: 0.18, fn: 's.slide === 1 && s.relationsDrawn.every(p => p === 0)', label: 'components are in place before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all supplied relationships exist before the tracer moves'},
    {at: 0.565, fn: `${ORDER} === JSON.stringify(['form','client'])`, label: 'the tracer follows the supplied order (form, then client, …)'},
    {at: 1, fn: `${ORDER} === JSON.stringify(['form','client','representative','clerk']) && s.stateShown === 1`, label: 'the tracer ends at the counter after passing the representative'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: the order restarts (nothing visited before the trace beat)'},
    {at: 1, fn: 's.connectorGaps.length === 3 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, fn: 's.ribbon === 1 && s.labelsClear && s.truncated.length === 0', label: 'the representative–client relation is drawn as the ribbon; labels clear; nothing cut'},
    {at: 0.6, fn: 's.focusScale > 1.1', label: 'the focus element (representative) enlarges while the tracer passes'},
    {at: 1, params: {traversalOrder: ['clerk', 'representative', 'client']}, fn: `${ORDER} === JSON.stringify(['clerk','representative','client'])`, label: 'a different supplied order is followed as supplied'},
    {at: 1, params: P('contrast-or-alternative'), fn: `${ORDER} === JSON.stringify(['form','client','clerk']) && s.ribbon === null && s.arrows.some(a => a.kind === 'sequence' && a.arrow)`, label: 'alternative (own action): no ribbon; the form goes from the client to the counter'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.ribbon === 1 && s.relationsDrawn.every(p => p === 1)', label: 'labels hidden: the same map and route are drawn'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.connectorGaps.every(g => g <= 16)', label: `${n}: nothing cut, connectors end at their elements`})),
    {at: 1, params: P('long-labels-stress'), fn: 's.labelsClear && s.connectorGaps.length === 4', label: 'long labels: relation labels clear of each other and of the components'},
  ],
});

suppliedTextSuite('LAW-0178', {
  fields: "const kinds = [...new Set(p.relationships.map(q => q.kind))]; return [...p.actors.map(a => a.name), p.roles.client, p.roles.representative, p.roles.clerk, p.props.document, p.props.documentId, p.props.counterSign, ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label), ...kinds.map(k => p.relationLabels[k])];",
  content: "const kinds = [...new Set(p.relationships.map(q => q.kind))]; return [...p.actors.map(a => a.name), p.roles.client, p.roles.representative, p.roles.clerk, p.props.document, p.props.documentId, p.props.counterSign, ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label), ...kinds.map(k => p.relationLabels[k])];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Ends here (as supplied)', 'Termina aquí (según lo aportado)'];",
});

// review round 2: the tracer parks beside the last component (item 12), labels stay clear of portraits and of each
// other, and the map fills the caption-safe box in every ratio with labels shown or hidden (item 11)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
ratioChecks('LAW-0178', 'tracer parked clear, labels clear, map fills the frame', [
  {at: [0.8, 1], fn: 's.tracerParked && !s.tracerOnFace && !s.tracerOnLabel', label: 'the parked tracer sits beside the last component, off every face and label'},
  {at: [0.5, 0.6], fn: '!s.tracerOnLabel', label: 'the tracer never passes under a relation label'},
  {at: [1], fn: 's.labelsClear && s.stateClear', label: 'relation labels and the end tag clear of each other and of the portraits'},
  {at: [1], dom: FILL, label: 'the map fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)'},
  // each relation label sits beside its own connector (no numbered legend), within the frame
  {at: [1], tv: ['all'], fn: '!s.numberedLabels', label: 'every relation label is drawn beside its own connector'},
  {at: [1], tv: ['all'], dom: "[...svg.querySelectorAll('[data-node^=\"rg-lg\"]')].every(e => { const r = e.getBoundingClientRect(), f = svg.getBoundingClientRect(); return r.left >= f.left - 1 && r.right <= f.right + 1 && r.top >= f.top - 1 && r.bottom <= f.bottom + 1; })", label: 'relation labels stay inside the frame'},
]);

// Re-review (rendered, every preset × ratio at the hold): each relation label's nearest connector is its OWN,
// within 40 px at 1080p (and any other connector at least 8 px further); no label leader crosses any text or
// the ribbon; no connector runs through the "ends here" tag. Label i = group rg-lg<i> (chip only, the leader
// excluded), connector i = path rg-c<i>-line sampled along its length.
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
const LEADERS_CLEAR = `(() => {
  // thresholds in px at 1080p, converted to screen px (the instance may be drawn scaled on the test page)
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'))
    .map(t => { const r = t.getBoundingClientRect(); return {t, b: {l: r.left - 5 * k, t: r.top - 5 * k, r: r.right + 5 * k, b: r.bottom + 5 * k}}; });
  const inside = (q, b) => q.x > b.l && q.x < b.r && q.y > b.t && q.y < b.b;
  const rib = svg.querySelector('[data-node="ribbon-b"]');
  const ribPts = [];
  if (rib && visible(rib) && rib.getTotalLength) { const m = rib.getScreenCTM(), L = rib.getTotalLength(); for (let j = 0; j <= 120; j++) ribPts.push(rib.getPointAtLength((L * j) / 120).matrixTransform(m)); }
  for (const grp of svg.querySelectorAll('[data-node^="rg-lg"]')) {
    if (!visible(grp)) continue;
    const line = grp.querySelector('line');
    if (!line) continue;
    const m = line.getScreenCTM();
    const A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m);
    const pts = Array.from({length: 30}, (_, i) => ({x: A.x + (B.x - A.x) * (0.08 + 0.84 * i / 29), y: A.y + (B.y - A.y) * (0.08 + 0.84 * i / 29)}));
    for (const {t, b} of texts) if (!grp.contains(t) && pts.some(q => inside(q, b))) return false;
    // (a leader may start on the ribbon when the ribbon is its own connector; it never crosses it further on)
    if (ribPts.length && pts.filter(q => Math.hypot(q.x - A.x, q.y - A.y) > 10 * k).some(q => ribPts.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 3 * k))) return false;
  }
  const st = svg.querySelector('[data-node="state-tag"]');
  if (st && visible(st)) {
    const r = st.getBoundingClientRect();
    for (const path of svg.querySelectorAll('[data-node^="rg-c"][data-node$="-line"]')) {
      if (!visible(path)) continue;
      const m = path.getScreenCTM(), L = path.getTotalLength();
      for (let j = 4; j <= 116; j++) { const q = path.getPointAtLength((L * j) / 120).matrixTransform(m); if (q.x > r.left && q.x < r.right && q.y > r.top && q.y < r.bottom) return false; }
    }
  }
  return true;
})()`;
ratioChecks('LAW-0178', 'relation labels beside their own connectors; leaders clear', [
  {at: [1], tv: ['all'], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (<= 40 px at 1080p, others >= 8 px further)"},
  {at: [1], tv: ['all'], dom: LEADERS_CLEAR, label: 'rendered: no label leader crosses text or the ribbon; no connector runs through the end tag'},
]);

// Round 3 (rendered, every preset × ratio at the hold, labels shown and hidden): connectors are routed cleanly —
// none passes through a portrait / the form (other than at its own ends); no connector end or arrowhead sits
// under the sign or any other text; connectors that share an element leave it from distinct attachment points;
// no two connectors run within 20 px of each other for more than 120 px. Distances in px at 1080p.
const ROUTES_CLEAN = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const bodies = [...svg.querySelectorAll('[data-node^="body-"]')].filter(e => visible(e)).map(e => {
    const r = e.getBoundingClientRect();
    const circle = !/form/.test(e.getAttribute('data-node'));
    return {id: e.getAttribute('data-node').slice(5), circle, cx: r.left + r.width / 2, cy: r.top + r.height / 2, rad: Math.min(r.width, r.height) / 2, r};
  });
  const inBody = (q, b, pad) => b.circle ? Math.hypot(q.x - b.cx, q.y - b.cy) < b.rad - pad : q.x > b.r.left + pad && q.x < b.r.right - pad && q.y > b.r.top + pad && q.y < b.r.bottom - pad;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node^="cast"]') && !t.closest('[data-node^="legend"]')).map(t => t.getBoundingClientRect());
  const inText = (q, pad) => texts.some(r => q.x > r.left - pad && q.x < r.right + pad && q.y > r.top - pad && q.y < r.bottom + pad);
  const lines = [...svg.querySelectorAll('[data-node^="rg-c"][data-node$="-line"]')].filter(e => visible(e) && e.getTotalLength() > 0).map(path => {
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 120; j++) pts.push(path.getPointAtLength((L * j) / 120).matrixTransform(m));
    const name = path.getAttribute('data-node').replace('-line', '');
    const head = svg.querySelector('[data-node="' + name + '-head"]');
    return {name, pts, len: L * m.a, head: head && visible(head) ? head.getBoundingClientRect() : null};
  });
  const nearestBody = q => bodies.reduce((a, b) => { const d = Math.hypot(q.x - b.cx, q.y - b.cy); return !a || d < a.d ? {b, d} : a; }, null).b;
  for (const ln of lines) {
    const A = ln.pts[0], Z = ln.pts[120];
    const ends = [nearestBody(A), nearestBody(Z)];
    // through a portrait / the form (away from its own two ends)
    for (const q of ln.pts.slice(6, 115)) for (const b of bodies) if (!ends.includes(b) && inBody(q, b, 3 * k)) return false;
    // ends and arrowhead clear of any text (sign included)
    if ([A, Z].some(q => inText(q, 4 * k))) return false;
    if (ln.head) { const c = {x: (ln.head.left + ln.head.right) / 2, y: (ln.head.top + ln.head.bottom) / 2}; if (inText(c, 4 * k)) return false; }
  }
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const a = lines[i], b = lines[j];
    const ea = [a.pts[0], a.pts[120]], eb = [b.pts[0], b.pts[120]];
    const sharedPts = [];
    for (const p of ea) for (const q of eb) if (nearestBody(p) === nearestBody(q)) { if (Math.hypot(p.x - q.x, p.y - q.y) < 12 * k) return false; sharedPts.push(p, q); }
    const step = a.len / 120;
    let run = 0;
    for (const q of a.pts) {
      const close = !sharedPts.some(e => Math.hypot(q.x - e.x, q.y - e.y) < 40 * k) && b.pts.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 20 * k);
      run = close ? run + step : 0;
      if (run > 120 * k) return false;
    }
  }
  return true;
})()`;
ratioChecks('LAW-0178', 'connectors routed cleanly (portraits, text, attachments, parallels)', [
  {at: [1], dom: ROUTES_CLEAN, label: 'rendered: no connector through a portrait, no end/arrowhead under text, distinct attachments, no close parallel runs'},
]);
