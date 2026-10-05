// LAW-0242 — Requerimiento previo · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking, and a
// relation is never drawn as causality by default.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, fills, textSizeOverTime, baselineTextAtHold} from './requerimiento-previo-checks.js';

const P = name => presetsFor('LAW-0242').find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';

contractSuite('LAW-0242', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.separated === 0', label: 'separate: components start gathered; no relationship drawn yet'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'components are in place before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.43, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all supplied relationships exist before the tracer moves'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: nothing is visited before the trace beat'},
    {at: 1, fn: `${ORDER} === JSON.stringify(['partyA','letter','trayB','calendar','replyPocket']) && s.stateShown === 1 && s.plan === 'received' && s.markP === 1`, label: 'the tracer follows the supplied order; states shown; reply on the supplied day'},
    {at: 1, fn: 's.connectorGaps.every(g => g <= 12)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && !s.kinds.includes('causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, fn: 's.labelsClear && s.truncated.length === 0', label: 'labels clear of each other and of the components; nothing cut'},
    {at: 0.64, fn: 's.focusScale > 1.05', label: 'the focus element (calendar) enlarges while the tracer passes'},
    {at: 1, params: {traversalOrder: ['replyPocket', 'calendar', 'trayB']}, fn: `${ORDER} === JSON.stringify(['replyPocket','calendar','trayB'])`, label: 'a different supplied order is followed as supplied'},
    {at: 1, params: P('contrast-or-alternative'), fn: `${ORDER} === JSON.stringify(['caseFile','partyA','letter','trayB','calendar']) && s.plan === 'pending' && s.markP === 0`, label: 'alternative: no reply supplied; the pocket stays empty'},
    {at: 0.5, params: {relationships: [{from: 'letter', to: 'trayB', kind: 'causal', label: 'as supplied'}]}, fn: "s.kinds.length === 1 && s.kinds[0] === 'causal'", label: 'a causal style appears only when supplied'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.calOpen === 1', label: 'labels hidden: the same mechanism'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.connectorGaps.every(g => g <= 12)', label: `${n}: nothing cut; connectors end at their elements`})),
  ],
});

suppliedTextSuite('LAW-0242', {
  fields: "const w = p.dates.window; const day = w[Math.max(0, Math.min(w.length - 1, p.dates.replyDay))]; const reply = p.relationships.some(q => q.from === 'partyB' && q.to === 'replyPocket'); return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.letter.ref, p.documents.letter.title, p.dates.sent, p.documents.replySlip, ...w, p.stages.sent, p.stages.delivered, reply ? p.stages.replied + ' · ' + day : p.stages.pending, ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label || p.relationLabels[q.kind])];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// each relation label's nearest connector is its own (<= 40 px at 1080p; any other >= 8 px further)
const OWN_NEAREST = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const conns = [];
  for (const path of svg.querySelectorAll('[data-node^="rel-c"][data-node$="-line"]')) {
    const i = +path.getAttribute('data-node').match(/^rel-c(\\d+)-line$/)[1];
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 120; j++) pts.push(path.getPointAtLength((L * j) / 120).matrixTransform(m));
    conns[i] = pts;
  }
  for (const lab of svg.querySelectorAll('[data-node^="rl"][data-node$="-chip"]')) {
    const i = +lab.getAttribute('data-node').match(/^rl(\\d+)-chip$/)[1];
    const r = lab.getBoundingClientRect();
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(r.left - q.x, 0, q.x - r.right), Math.max(r.top - q.y, 0, q.y - r.bottom)))) / k;
    if (!conns[i]) return false;
    const own = dist(conns[i]);
    if (own > 40) return false;
    for (const [j, pts] of conns.entries()) if (pts && j !== i && dist(pts) < own + 8) return false;
  }
  return true;
})()`;
// connectors are routed cleanly: none passes through a component body other than its own two ends, and no
// connector end or arrowhead sits under a text
const ROUTES_CLEAN = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const bodies = [...svg.querySelectorAll('[data-node^="el-"][data-node$="-in"]')].map(e => ({id: e.getAttribute('data-node'), r: e.getBoundingClientRect()}));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && t.textContent.trim() && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect());
  const inR = (q, b, pad) => q.x > b.left + pad && q.x < b.right - pad && q.y > b.top + pad && q.y < b.bottom - pad;
  for (const path of svg.querySelectorAll('[data-node^="rel-c"][data-node$="-line"]')) {
    if (!visible(path)) continue;
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 80; j++) pts.push(path.getPointAtLength((L * j) / 80).matrixTransform(m));
    const near = q => bodies.reduce((a, b) => { const d = Math.hypot(q.x - (b.r.left + b.r.right) / 2, q.y - (b.r.top + b.r.bottom) / 2); return !a || d < a.d ? {b, d} : a; }, null).b;
    const ends = [near(pts[0]), near(pts[80])];
    for (const q of pts.slice(6, 75)) for (const b of bodies) if (!ends.includes(b) && inR(q, b.r, 4 * k)) return false;
    if ([pts[0], pts[80]].some(q => texts.some(t => inR(q, t, -2 * k)))) return false;
  }
  return true;
})()`;
// coordinator decision 2026-09-26 (standing stress rule, AUTHORING item 20): the long-labels-stress lengths of this item are
// capped to the longest values found to fit every ratio at >= 16 px without scaling (see the preset description in
// LAW-0242.presets.json for the capped fields and the measurements). No floor or limit in this file is relaxed.
// rendered: at the hold no state tag (sent / delivered / outcome) lies over a prop or over any text it does not own
const TAGS_OFF_PROPS = `(() => { const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
 const R = e => e.getBoundingClientRect(); const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
 const chips = [...svg.querySelectorAll('[data-node^="st-"][data-node$="-chip"]')].filter(e => eff(e) > 0.3);
 const props = [...svg.querySelectorAll('[data-node^="el-"]')].filter(e => !/-lab$|-labg$|-chip$/.test(e.dataset.node) && eff(e) > 0.3 && !e.querySelector('[data-node^="el-"]'));
 const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
 const out = [];
 for (const c of chips) { const b = R(c); for (const p of props) if (meet(b, R(p))) out.push(c.dataset.node + '~' + p.dataset.node); for (const t of texts) if (!c.contains(t) && meet(b, R(t))) out.push(c.dataset.node + '~"' + t.textContent.slice(0, 16) + '"'); }
 return out.length === 0; })()`;
ratioChecks('LAW-0242', 'labels beside their connectors, clean routes, faces, frame', [
  {at: [1], tv: ['all'], dom: OWN_NEAREST, label: "each relation label's nearest connector is its own (<= 40 px)"},
  {at: [1], dom: ROUTES_CLEAN, label: 'no connector passes through another component; ends not under text'},
  {at: [1], tv: ['all'], dom: tagsBeside(['st-', 'rl']), label: 'state tags and relation labels beside their elements (leader <= 40 px), leaders cross no text'},
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip or label covers a portrait'},
  {at: [0.3, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [0, 0.1, 0.3, 0.6, 1], dom: IN_FRAME, label: 'nothing leaves the frame'},
  {at: [1], dom: headsAtLeast(80), label: 'portraits readable (>= 80 px at 1080p)'},
  {at: [1], dom: fills(0.85, 0.6), label: 'the diagram fills the caption-safe box'},
  {at: [0, 0.5, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: at the hold no state tag intersects any prop or any text'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02: text, props, lens)'},
  {at: [1], fn: 's.labelsOffFaces', label: 'layout: labels clear of the portraits'},
]);

// every visible text >= 16 px at every sampled u (coordinator rule, AUTHORING 'text size at every moment')
textSizeOverTime('LAW-0242', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0242')], test, expect});

// baseline presets, baseline-es included, keep every text >= 19.5 px at the hold in every ratio (coordinator 2026-09-26)
baselineTextAtHold('LAW-0242', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0242')], test, expect});
