// LAW-0250 — Presentación de demanda · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking, and a
// relation is never drawn as causality by default. Motif rule: no arrowheads unless a causal link is supplied; the
// order is captioned "Sequence as configured (illustrative)".
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, fills, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE} from './presentacion-demanda-checks.js';

const ID = 'LAW-0250';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.separated === 0 && s.refShown === 0', label: 'separate: components start gathered; no relationship drawn; the reference box is blank'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'components are in place before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.43, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible && s.refShown === 0', label: 'all supplied relationships exist before the tracer moves; nothing stamped yet'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: nothing is visited before the trace beat'},
    ...[0.5, 0.58, 0.62, 0.64, 0.7].map(u => ({at: u, fn: "s.refShown === 0 || s.visitOrder.includes('reference')", label: `u ${u}: the reference is stamped only once the tracer has reached it (cause before effect)`})),
    {at: 0.63, fn: 's.focusScale > 1.05', label: 'the focus element (the reference box) enlarges while the tracer passes'},
    {at: 1, fn: `${ORDER} === JSON.stringify(['partyA','filing','intake','clerk','reference','calendar']) && s.stateShown === 1 && s.plan === 'registered' && s.refShown === 1 && s.markP === 1`, label: 'the tracer follows the supplied order; states shown; reference stamped; entry on the supplied day'},
    {at: 1, fn: 's.connectorGaps.every(g => g <= 12)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'causal' ? a.arrow : !a.arrow) && !s.kinds.includes('causal')", label: 'no arrowheads (no directed institutional arrows); no causal link unless supplied'},
    {at: 1, fn: 's.labelsClear && s.truncated.length === 0', label: 'labels clear of each other and of the components; nothing cut'},
    {at: 1, params: {traversalOrder: ['calendar', 'reference', 'intake']}, fn: `${ORDER} === JSON.stringify(['calendar','reference','intake'])`, label: 'a different supplied order is followed as supplied'},
    {at: 1, params: P('contrast-or-alternative'), fn: `${ORDER} === JSON.stringify(['caseFile','partyA','filing']) && s.plan === 'draft' && s.refShown === 0 && s.markP === 0`, label: 'alternative: no clerk–reference relationship supplied; the filing stays a draft; box blank; no entry'},
    {at: 0.5, params: {relationships: [{from: 'filing', to: 'intake', kind: 'causal', label: 'as supplied'}]}, fn: "s.kinds.length === 1 && s.kinds[0] === 'causal' && s.arrows[0].arrow", label: 'a causal style (with its arrowhead) appears only when supplied'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.calOpen === 1 && s.refShown === 1', label: 'labels hidden: the same mechanism'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.connectorGaps.every(g => g <= 12)', label: `${n}: nothing cut; connectors end at their elements`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const w = p.dates.window; const day = w[Math.max(0, Math.min(w.length - 1, p.dates.entryDay))]; const reg = p.relationships.some(q => (q.from === 'clerk' && q.to === 'reference') || (q.from === 'reference' && q.to === 'clerk')); return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.title, p.documents.filing.dated, ...(reg ? [p.documents.reference, p.stages.sent, p.stages.registered + ' · ' + day] : [p.stages.draft]), ...w, ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label || p.relationLabels[q.kind])];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Sequence as configured (illustrative)', 'Secuencia según la configuración (ilustrativa)'];",
});

// relation-label gaps: each relation label's nearest connector is its own (<= 40 px at 1080p; any other >= 8 px further)
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
// connector end sits under a text
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
// rendered: no state tag lies over a component or over any text it does not own (when the tags appear and at the hold)
const TAGS_OFF_PROPS = `(() => { const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
 const R = e => e.getBoundingClientRect(); const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
 const chips = [...svg.querySelectorAll('[data-node^="st-"][data-node$="-chip"]')].filter(e => eff(e) > 0.3);
 const props = [...svg.querySelectorAll('[data-node^="el-"]')].filter(e => !/-lab$|-labg$|-chip$/.test(e.dataset.node) && eff(e) > 0.3 && !e.querySelector('[data-node^="el-"]'));
 const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
 for (const c of chips) { const b = R(c); for (const p of props) if (meet(b, R(p))) return false; for (const t of texts) if (!c.contains(t) && meet(b, R(t))) return false; }
 return true; })()`;
// coordinator decision (standing stress rule, AUTHORING item 20, 2026-09-26): the long-labels-stress component labels
// and stage captions of this item are capped to the longest values found to fit every ratio at >= 16 px without scaling (see the preset
// description in LAW-0250.presets.json for the capped fields and the measurements). No floor or limit in this file is
// relaxed.
// no arrowhead is drawn unless a causal link is supplied (motif rule: no directed institutional arrows)
const NO_HEADS = `(() => ![...svg.querySelectorAll('[data-node^="rel-c"][data-node$="-head"]')].some(e => e.getAttribute('opacity') !== '0'))()`;
// the order is captioned "Sequence as configured (illustrative)" while the tracer runs and at the hold
const SEQ_CAPTION = `(() => { const n = svg.querySelector('[data-node="seq-noteg"]'); return Boolean(n) && parseFloat(n.getAttribute('opacity')) === 1 && /as configured|según la configuración/i.test(n.textContent); })()`;

ratioChecks(ID, 'labels beside their connectors, clean routes, faces, frame', [
  {at: [0.5, 1], tv: ['all'], dom: OWN_NEAREST, label: "relation-label gaps: each relation label's nearest connector is its own (<= 40 px; others >= 8 px further)"},
  {at: [1], dom: ROUTES_CLEAN, label: 'no connector passes through another component; ends not under text'},
  {at: [1], tv: ['all'], dom: tagsBeside(['st-', 'rl']), label: 'state tags and relation labels beside their elements (leader <= 40 px), leaders cross no text'},
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip or label covers a portrait'},
  {at: [0.3, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [1], dom: headsAtLeast(80), label: 'portraits readable (>= 80 px at 1080p)'},
  {at: [0.2, 1], dom: fills(0.85, 0.6), label: 'the diagram fills the caption-safe box (once separated, and at the hold)'},
  {at: times(0, 1, 0.05), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0.6, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [0.6, 0.72, 1], dom: NO_HEADS, label: 'no arrowheads by default'},
  {at: [0.5, 0.7, 1], tv: ['all'], dom: SEQ_CAPTION, label: 'the order is captioned "Sequence as configured (illustrative)"'},
  {at: [0.82, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no state tag intersects any component or any text'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [1], fn: 's.labelsOffFaces', label: 'layout: labels clear of the portraits'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

// with only locale "es", every default text is shown in Spanish: no English default remains (review r2)
ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' '); return !/\\b(Party|Registry|Day \\d|fictional|Case file|Written|Handed|Registered|Draft|supplied|Reference|Sequence|Filing|Same in|Changed fact|Before|After|Datum)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

// every line of every visible label is drawn whole and on top (review r2: a tray label's second line hid behind the desk)
ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop, the counter or a person'},
]);
