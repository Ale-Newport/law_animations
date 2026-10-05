// LAW-0142 — Ámbito territorial · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: the parts separate before any relationship is drawn, only the
// supplied relationships appear (plain relations without arrows, no causal link by
// default), every connector ends on its two parts, the tracer follows the supplied
// order (the same when seeking) and the gather leaves the combined placement visible
// as supplied — every pawn on its supplied zone, nothing concluded.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {minTextPx, neutralZonePatternTest} from './ambito-territorial-checks.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/sources/LAW-0142.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;
const ORDER = "JSON.stringify(s.visitOrder) === JSON.stringify(['hierarchy','source','article','text','zones','facts','reading'])";
const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const allPlacedEverywhere = [];
for (const [shape, sh] of Object.entries(SHAPES)) {
  for (const name of ['baseline-illustrative', 'contrast-or-alternative', 'long-labels-stress', 'baseline-es']) {
    allPlacedEverywhere.push({at: 1, params: {...P(name), ...sh}, fn: 's.allPlaced && JSON.stringify(s.slotZones) === JSON.stringify(s.zones) && s.landed === 1', label: `${name} ${shape}: every pawn lands on its supplied zone`});
  }
}

contractSuite('LAW-0142', {
  continuity: ['tracer'],
  semantic: [
    {at: 0.02, fn: 's.separated < 1 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible', label: 'separate: the sheets and parts are still moving apart, no relationship drawn yet'},
    {at: 0.185, fn: 's.separated === 1 && s.relationsDrawn.every(p => p < 1)', label: 'everything is separated before the relationships are drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.435, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all relationships are drawn before the tracer runs'},
    {at: 0.5, fn: 's.connectorsLand && !s.arrowOnPlainRelation && !s.kinds.includes("causal") && s.kinds.every(k => k === "relation")', label: 'every connector ends on its parts; plain relations have no arrow; no causal link by default'},
    {at: 0.6, fn: ORDER + ' && s.tracerVisible', label: 'the tracer follows the supplied traversal order'},
    {at: 0.62, fn: 's.visited.join() === s.visitOrder.slice(0, s.visited.length).join() && s.visited.length > 0', label: 'visits happen in the supplied order (no reordering when seeking)'},
    {at: 0.6, fn: 's.focus === "zones" && s.focusScale > 1', label: 'the focus part (zone board) swells while the tracer is on it'},
    {at: 0.8, fn: 's.dropped > 0 && s.dropped < 1 && !s.tracerVisible', label: 'gather: the sheet and the pawns drop onto the board'},
    {at: 1, fn: 's.dropped === 1 && s.landed === 1 && JSON.stringify(s.rels) === JSON.stringify(["shared","different","shared"]) && s.allPlaced', label: 'gather: the combined placement stays visible, as supplied'},
    {at: 0.6, params: {traversalOrder: ['facts', 'text', 'zones']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['facts','text','zones'])", label: 'the tracer follows another supplied order'},
    {at: 0.5, params: P('contrast-or-alternative'), fn: "s.kinds.filter(k => k === 'sequence').length === 2 && !s.kinds.includes('causal') && s.connectorsLand", label: 'alternative: sequences appear only where the author supplies them'},
    {at: 1, params: P('contrast-or-alternative'), fn: "JSON.stringify(s.rels) === JSON.stringify(['different','shared','different']) && JSON.stringify(s.zones) === JSON.stringify([0,2,1]) && s.focus === 'text'", label: 'alternative data: the text on Zone Cedar, other pawns and focus'},
    {at: 0.5, params: {relationships: [{from: 'text', to: 'zones', kind: 'causal', label: 'as supplied'}]}, fn: "s.kinds.length === 1 && s.kinds[0] === 'causal'", label: 'a causal style appears only when supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.allPlaced && s.landed === 1 && s.connectorsLand', label: 'labels hidden: the same mechanism runs'},
    ...allPlacedEverywhere,
  ],
});

suppliedTextSuite('LAW-0142', {
  fields: 'return [p.sources[0].title, p.sources[0].note, ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, p.passages[0].zone, ...p.zones.map(z => z.name), ...p.facts.map(f => f.label), ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label || p.relationLabels[r.kind])];',
  content: 'return [p.sources[0].title, ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, ...p.zones.map(z => z.name), ...p.facts.map(f => f.label)];',
  captions: 'return [...p.elements.map(e => e.label), ...p.relationships.map(r => r.label || p.relationLabels[r.kind])];',
});

// review fixes (every preset × real ratio × labels shown/hidden)
// Round-2 rendered checks at the hold. LINES_CLEAR: no connector (rel-c{i}-line) or caption leader (the line in
// rlg{i}) passes over any visible text other than its own caption, or over the magnifier. TAGS_CLEAR: no fact tag's
// text overlaps another visible text.
const VIS = `const vis = el => { for (let e = el; e && e !== svg; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.5) return false; } return true; };`;
const LINES_CLEAR = `(() => {
  ${VIS}
  const texts = [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer="content-notice"]')).map(t => ({t, b: t.getBoundingClientRect()})).filter(q => q.b.width > 0);
  const lupa = svg.querySelector('[data-node="M-reading"]');
  const props = lupa && vis(lupa) ? [lupa.getBoundingClientRect()] : [];
  const lines = [];
  svg.querySelectorAll('[data-node$="-line"]').forEach(el => { const m = (el.getAttribute('data-node') || '').match(/^rel-c(\\d+)-line$/); if (m && vis(el)) lines.push({el, i: m[1]}); });
  svg.querySelectorAll('[data-node^="rlg"]').forEach(gr => { const m = gr.getAttribute('data-node').match(/^rlg(\\d+)$/); const ln = gr.querySelector('line'); if (m && ln && vis(gr)) lines.push({el: ln, i: m[1]}); });
  for (const {el, i} of lines) {
    const own = svg.querySelector('[data-node="rlg' + i + '"]');
    const M = el.getScreenCTM();
    const L = el.getTotalLength();
    for (let d = 2; d < L - 2; d += 3) {
      const pt = el.getPointAtLength(d).matrixTransform(M);
      for (const q of texts) { if (own && own.contains(q.t)) continue; const b = q.b; if (pt.x > b.left + 1 && pt.x < b.right - 1 && pt.y > b.top + 1 && pt.y < b.bottom - 1) return false; }
      for (const b of props) if (pt.x > b.left + 2 && pt.x < b.right - 2 && pt.y > b.top + 2 && pt.y < b.bottom - 2) return false;
    }
  }
  return true;
})()`;
const TAGS_CLEAR = `(() => {
  ${VIS}
  const tags = svg.querySelector('[data-node="tags"]');
  if (!tags) return true;
  const all = [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer="content-notice"]'));
  const mine = all.filter(t => tags.contains(t));
  return mine.every(a => { const A = a.getBoundingClientRect(); return all.every(b => { if (b === a) return true; const B = b.getBoundingClientRect(); return A.right <= B.left + 1 || B.right <= A.left + 1 || A.bottom <= B.top + 1 || B.bottom <= A.top + 1; }); });
})()`;

// Round 3: CARDS_CLEAR — every card or chip body (a filled shape that frames a text: tag, chip, tab, caption, flag,
// book label…) covers no text box it does not own that is drawn beneath it (earlier in document order).
const CARDS_CLEAR = `(() => {
  ${VIS}
  const texts = [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer="content-notice"]') && t.getBBox().width > 0);
  const order = new Map([...svg.querySelectorAll('*')].map((e, i) => [e, i]));
  const R = e => e.getBoundingClientRect();
  const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
  const cards = [];
  for (const t of texts) {
    const tb = R(t);
    // the card: a filled shape in the text's group (or up to two groups up) that frames the text
    let g0 = t.parentElement;
    for (let up = 0; up < 3 && g0 && g0 !== svg; up++, g0 = g0.parentElement) {
      const shapes = [...g0.children].filter(c => (c.tagName === 'path' || c.tagName === 'rect') && vis(c) && c.getAttribute('fill') && c.getAttribute('fill') !== 'none' && order.get(c) < order.get(t));
      const card = shapes.find(c => { const b = R(c); return inside(tb, b) && b.width * b.height < tb.width * tb.height * 12; });
      if (card) { cards.push({card, owner: g0}); break; }
    }
  }
  for (const {card, owner} of cards) {
    const cb = R(card);
    for (const t of texts) {
      if (owner.contains(t) || order.get(t) > order.get(card)) continue;
      if (meet(cb, R(t))) return false;
    }
  }
  return true;
})()`;

// Round 4: through the opening the whole stack (its visible sheets, tabs, tags and flags) stays inside the frame
// (rendered bounds, every 0.005 over u 0–0.15)
const STACK_IN_FRAME = `(() => {
  const vis = el => { for (let e = el; e && e !== svg; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.02) return false; } return true; };
  const st = svg.querySelector('[data-node="stackAll"]');
  const F = svg.getBoundingClientRect();
  const leaves = [...st.querySelectorAll('path, rect, circle, ellipse, text, line')].filter(vis);
  return leaves.every(e => { const b = e.getBoundingClientRect(); if (b.width === 0 && b.height === 0) return true; return b.left >= F.left - 0.5 && b.right <= F.right + 0.5 && b.top >= F.top - 0.5 && b.bottom <= F.bottom + 0.5; });
})()`;
const every005 = Array.from({length: 31}, (_, i) => Math.round(i * 5) / 1000);
ratioChecks('LAW-0142', 'round 4: the opening stack stays inside the frame', [
  {at: every005, dom: STACK_IN_FRAME, label: 'the stack (every visible piece of it) lies inside the frame, u 0–0.15'},
]);

ratioChecks('LAW-0142', 'round 3: no card or chip covers a text it does not own', [
  {at: [0.3, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no card or chip body covers another text (hold and u 0.3)'},
]);

ratioChecks('LAW-0142', 'round 2: connectors, leaders and tags clear of text and props', [
  {at: [1], dom: LINES_CLEAR, tv: ['all'], label: 'no connector or caption leader passes over another text or the magnifier'},
  {at: [1], dom: TAGS_CLEAR, tv: ['all'], label: 'no fact tag overlaps another text'},
  {at: times(0.1, 0.2, 0.01), fn: 's.partsFill', label: 'no near-empty beat while the stack settles: the parts are fading in'},
]);

ratioChecks('LAW-0142', 'opening, reveal, connectors and captions', [
  {at: [0, 0.02, 0.04], fn: 's.stackCover >= 0.55', label: 'the stack opens large and centred (no small stack on a blank frame)'},
  {at: times(0, 0.2, 0.01), fn: 's.revealAfterSettle && s.tabsWhileMoving === 0', label: 'parts and tabs appear only once the sheets have settled (nothing slides over text)'},
  {at: [0.5, 1], fn: 's.connectorCrossings.length === 0 && s.connectorsLand', label: 'every part-to-sheet connector lands on its sheet without crossing another sheet'},
  {at: [1], fn: 's.relLabelsOverText.length === 0 && s.relLabelsOnBoard.length === 0', tv: ['all'], label: 'relation captions sit clear of text, parts, tags, tabs and the board'},
  {at: [1], dom: minTextPx(16), tv: ['all'], label: 'no visible text under 16 px at the hold'},
]);
neutralZonePatternTest('LAW-0142');
