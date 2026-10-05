// LAW-0246 — Preparación de demanda · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking, and a relation
// is never drawn as causality by default.
// Windows (u): separate 0.02–0.16 · relationships drawn one by one 0.19–0.41 · tracer 0.45–0.74 · states 0.75–0.81 (hold
// from 0.81).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, TEXT_OFF_BARS, NEUTRAL_MARKERS, textSizeOverTime, baselineTextAtHold,
  labelsOffProps, contentShare, coverageOverTime, playedVsSeek, coldCreate,
  NO_SPLIT_TOKENS, LEADS_WITH_CHIPS,
} from './preparacion-demanda-checks.js';

const ID = 'LAW-0246';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const ORDER = 'JSON.stringify(s.visitOrder)';
const ELEMENTS = ['el-caseFile-g', 'el-filing-g', 'el-calendar-g', 'el-pa-g', 'el-pb-g'];

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.separated === 0 && s.stateShown === 0', label: 'separate: the components start gathered; no relationship drawn yet'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'components are in place before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.43, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all supplied relationships exist before the tracer moves'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: nothing is visited before the trace beat'},
    {at: 1, fn: `${ORDER} === JSON.stringify(['partyA','caseFile','facts','requests','documents','filing','partyB']) && s.stateShown === 1 && s.linked.every(Boolean)`, label: 'the tracer follows the supplied order; every section shows its state'},
    {at: 0.655, fn: 's.focusScale > 1.02 && s.focusScale <= 1.12', label: 'the focus element (the filing) enlarges (up to 1.12×) while the tracer is on it'},
    {at: 0.55, fn: 's.focusScale === 1', label: 'the focus element keeps its size while the tracer is elsewhere'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && !s.kinds.includes('causal') && !s.sequenceCaption", label: 'plain relations have no arrowhead; no causal link or sequence unless supplied'},
    {at: 1, fn: 's.labelsClear && s.truncated.length === 0 && s.fitted', label: 'labels clear of each other and of the components; nothing cut'},
    {at: 1, params: {traversalOrder: ['documents', 'filing', 'partyB']}, fn: `${ORDER} === JSON.stringify(['documents','filing','partyB'])`, label: 'a different supplied order is followed as supplied'},
    {at: 1, params: P('contrast-or-alternative'), fn: `${ORDER} === JSON.stringify(['caseFile','facts','requests','filing','partyB']) && !s.linked[2] && s.linked[0] && s.sequenceCaption && s.kinds.includes('sequence')`, label: 'alternative: no documents link (its section stays to complete), one supplied sequence with its caption'},
    {at: 0.5, params: {relationships: [{from: 'facts', to: 'filing', kind: 'causal', label: 'as supplied'}]}, fn: "s.kinds.length === 1 && s.kinds[0] === 'causal' && s.arrows[0].arrow", label: 'a causal style appears only when supplied'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.stateShown === 1', label: 'labels hidden: the same mechanism'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.labelsClear && s.fitted && s.routeProblems.length === 0', label: `${n}: nothing cut; labels clear; every connector clear; fitted`})),
    // (stress: all eight relationships — the schema maximum — including Party A → calendar, drawn by the router; no cap)
    {at: 1, params: P('long-labels-stress'), fn: 's.kinds.length === 8 && s.routedLinks === 1 && s.routeProblems.length === 0', label: 'stress: eight relationships; the Party A → calendar link is routed clear of every element, caption and label'},
    {at: 1, params: {relationships: [{from: 'partyA', to: 'calendar', kind: 'relation', label: 'checks'}, {from: 'facts', to: 'filing', kind: 'relation', label: 'assembled into'}]}, fn: 's.routedLinks === 1 && s.routeProblems.length === 0', label: 'a configured link outside the built-in pairs is routed around the elements (orthogonal path)'},
    {at: 1, params: {relationships: [{from: 'partyA', to: 'partyB', kind: 'relation', label: 'writes to'}, {from: 'calendar', to: 'caseFile', kind: 'causal', label: 'causes (as supplied)'}, {from: 'facts', to: 'filing', kind: 'relation', label: 'assembled into'}]}, fn: 'Array.isArray(s.routeProblems) && (s.routeProblems.length === 0 ? s.fitted : !s.fitted)', label: 'a link the router cannot clear is reported (semantic.routeProblems) and the layout is not counted as fitted'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const lab = id => (p.elements.find(e => e.id === id) || {}).label; const linked = ['facts','requests','documents'].map(id => p.relationships.some(q => (q.from === id && q.to === 'filing') || (q.to === id && q.from === 'filing'))); return [p.parties[0].name, p.parties[1].name, p.parties[0].role, p.parties[1].role, p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.ref, p.documents.filing.title, ...p.sections.map(s => s.heading), ...p.sections.map(s => s.item), p.dates.filing, p.dates.calendar, p.labels.calendar, ...(linked.some(Boolean) ? [p.states.inPlace] : []), ...(linked.some(x => !x) ? [p.states.pending] : []), lab('caseFile'), lab('filing'), lab('calendar'), ...p.relationships.map(q => q.label || p.relationLabels[q.kind])].filter(Boolean);",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// each relation label's nearest connector is its own: <= 24 px from it (1080p) and any other connector >= 20 px further
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
    if (own > 24) return false;
    for (const [j, pts] of conns.entries()) if (pts && j !== i && dist(pts) < own + 20) return false;
  }
  return true;
})()`;
// every connector ends on its two elements (each end within 12 px of a drawn element), passes through no third element
// and never runs under a visible text (no text is struck through by a line)
const ROUTES_CLEAN = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const els = ['el-caseFile', 'el-filing', 'el-calendar', 'pa-badge', 'pb-badge', 'el-facts', 'el-requests', 'el-documents'].map(n => ({n, r: svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect()}));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && t.textContent.trim() && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect());
  const near = (q, b, pad) => q.x > b.left - pad && q.x < b.right + pad && q.y > b.top - pad && q.y < b.bottom + pad;
  const inR = (q, b, pad) => q.x > b.left + pad && q.x < b.right - pad && q.y > b.top + pad && q.y < b.bottom - pad;
  for (const path of svg.querySelectorAll('[data-node^="rel-c"][data-node$="-line"]')) {
    if (!visible(path)) continue;
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 60; j++) pts.push(path.getPointAtLength((L * j) / 60).matrixTransform(m));
    const ends = [pts[0], pts[60]].map(q => els.filter(e => near(q, e.r, 12 * k)).map(e => e.n));
    if (ends.some(e => !e.length)) return false;
    const own = new Set(ends.flat());
    // (a piece lies inside the case file: both count as its own)
    if ([...own].some(n => ['el-facts', 'el-requests', 'el-documents'].includes(n))) own.add('el-caseFile');
    for (const q of pts.slice(4, 57)) for (const e of els) if (!own.has(e.n) && inR(q, e.r, 3 * k)) return false;
    if (pts.some(q => texts.some(t => inR(q, t, -1)))) return false;
  }
  return true;
})()`;
// the five component groups (with their captions and labels) never overlap one another — at rest, while they separate
// and at the hold
const GROUPS_APART = `(() => {
  const gs = ${JSON.stringify(ELEMENTS)}.map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean).map(e => e.getBoundingClientRect());
  for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) {
    const a = gs[i], b = gs[j];
    const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ix > 1 && iy > 1) return false;
  }
  return true;
})()`;
// the tracer (its halo) never covers visible text and never sits on a portrait's face
const TRACER_CLEAR = `(() => {
  const tr = svg.querySelector('[data-node="tracer"]');
  if (!tr || !visible(tr) || parseFloat(tr.getAttribute('opacity') || '1') < 0.05) return true;
  const t = tr.getBoundingClientRect();
  const area = t.width * t.height;
  for (const x of svg.querySelectorAll('text')) {
    if (!visible(x) || !x.textContent.trim() || x.closest('[data-layer="content-notice"]')) continue;
    const b = x.getBoundingClientRect();
    const ix = Math.min(t.right, b.right) - Math.max(t.left, b.left), iy = Math.min(t.bottom, b.bottom) - Math.max(t.top, b.top);
    if (ix > 0 && iy > 0 && ix * iy > 0.1 * area) return false;
  }
  const c = {x: t.left + t.width / 2, y: t.top + t.height / 2};
  for (const n of ['pa-badge', 'pb-badge']) {
    const b = svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect();
    if (Math.hypot(c.x - (b.left + b.width / 2), c.y - (b.top + b.height / 2)) < b.width * 0.4) return false;
  }
  return true;
})()`;
const PROPS = ['el-caseFile', 'el-filing', 'el-calendar', 'pa-badge-body', 'pb-badge-body', 'el-facts', 'el-requests', 'el-documents'];
ratioChecks(ID, 'labels beside their own connectors, clean routes, faces, frame', [
  {at: [0, 0.5, 1], dom: NO_SPLIT_TOKENS, label: 'RENDERED: no reference or word is broken across lines (no hyphen break, no 1–2 character line)'},
  {at: [0.3, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].map(x => x.textContent).join(' '); return !/Party A|Party B|Case file|Written claim|Delivery note|as supplied|Only whether|Every piece|Filing complete|Section to complete|The filing as assembled|Changed datum/.test(t) && /Parte A|Expediente/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
  {at: [1], tv: ['all'], dom: OWN_NEAREST, label: "RENDERED: each relation label's nearest connector is its own (<= 24 px, others >= 20 px further)"},
  {at: [1], dom: ROUTES_CLEAN, label: 'RENDERED: each connector ends on its own two elements, crosses no third element and runs under no text'},
  // (60 fps over the whole trace — the focus element grows and shrinks there: every connector end moves with it)
  {at: times(0.43, 0.76, 1 / 420), tv: ['all'], dom: ROUTES_CLEAN, label: 'RENDERED, 60 fps over the whole trace (u 0.43–0.76): no connector runs under any text or through a third element while the focus element is enlarged'},
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip or label covers a portrait'},
  {at: [0.3, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [1], dom: headsAtLeast(80), label: 'portraits readable (>= 80 px at 1080p, the pilot mechanism floor)'},
  {at: [0.2, 1], dom: contentShare(ELEMENTS, 0.71), label: 'RENDERED: the diagram spans >= 0.71 of the FRAME width once separated'},
  {at: [1], tv: ['all'], dom: labelsOffProps(PROPS), label: 'RENDERED: no relation label, chip or key lies over a component or over text it does not own'},
  {at: [0, 0.5, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.03, 0.06, 0.09, 0.12, 0.16, 0.2, 1], dom: GROUPS_APART, label: 'RENDERED: the component groups (captions included) never overlap — at rest, while separating and at the hold'},
  {at: times(0.45, 0.75, 0.005), tv: ['all'], dom: TRACER_CLEAR, label: 'RENDERED: the tracer never covers a label, heading or other text, and never sits on a face'},
  {at: times(0.45, 0.75, 0.01), tv: ['all'], dom: labelsOffProps(PROPS), label: 'RENDERED: while the focus element is enlarged, no relation label, chip or key lies over it or over any other component'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
]);

textSizeOverTime(ID, {presets: ALL, test, expect});
baselineTextAtHold(ID, {presets: ALL, test, expect});
// (the diagram's content: its components, and — once drawn — its connectors, their labels and the key)
const DIAGRAM = [...ELEMENTS, ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(i => [`rel-c${i}`, `rl${i}`]), 'key', 'seq-cap'];
coverageOverTime(ID, {groups: DIAGRAM, presets: ALL, test, expect});
playedVsSeek(ID, {presets: ALL, test, expect});
coldCreate(ID, {presets: ALL, test, expect});
