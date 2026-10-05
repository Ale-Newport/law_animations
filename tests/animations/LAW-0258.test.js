// LAW-0258 — Contestación estructurada · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element; the order does not change on seek; a relation is
// never drawn as causality by default (no arrowheads unless a causal link is supplied).
// Windows (u): separate 0.02–0.17; relationships drawn one by one 0.19–0.42; tracer 0.44–0.72 (default order partyA →
// claim → trays → response → calendar; the response is reached at u ≈ 0.63); pairing from the tracer's arrival at the
// response for 0.12 (ending by 0.76); states and the calendar mark from 0.76.
// LEGAL: 'admitted' / 'disputed' are only states supplied for this example. Nothing shows an effect, burden,
// consequence or outcome; ● and ◆ have equal weight; no ticks, no green, no arrowheads by default.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, CONNECTOR_OFF_TEXT, relationLabelsNearest} from './contestacion-estructurada-checks.js';

const ID = 'LAW-0258';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0.05, fn: "s.beat === 'separate' && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible && s.stateShown === 0 && s.answersShown.every(v => v === 0)", label: 'separate: the components move apart; nothing is related yet'},
    {at: 0.3, fn: "s.relationsDrawn.some(v => v > 0 && v < 1) || (s.relationsDrawn.some(v => v === 1) && s.relationsDrawn.some(v => v === 0))", label: 'relate: the supplied relationships are drawn one by one'},
    ...[0.22, 0.3, 0.38].map(u => ({at: u, fn: 's.relationsDrawn.every((v, i) => i === 0 || v <= s.relationsDrawn[i - 1])', label: `u=${u}: relationships drawn in the supplied order`})),
    {at: 0.43, fn: 's.relationsDrawn.every(v => v === 1) && s.arrows.every(a => !a.arrow) && !s.kinds.includes("causal")', label: 'every supplied relationship drawn; none is causal and none has an arrowhead (relation is not causality by default)'},
    {at: 0.43, fn: 's.connectorGaps.every(g => g <= 14)', label: 'every connector ends on its element (gap <= 14 design units)'},
    {at: 0.58, fn: "s.tracerVisible && s.visitOrder.join() === ['partyA', 'claim', 'trays'].slice(0, s.visitOrder.length).join() && s.pairActive === -1 && s.answersShown.every(v => v === 0)", label: 'trace: the tracer follows the supplied order; no pairing before it reaches the response'},
    {at: 0.67, fn: "s.visitOrder.includes('response') && s.pairActive >= 0 && s.answersShown[0] === 1 && s.stateShown === 0", label: 'at the response: its sections are paired with their allegations; no state shown yet'},
    {at: 0.7, fn: 's.answersShown.every((v, i) => v === 0 || i <= s.pairActive)', label: 'each answer number appears only with its own pair (in order)'},
    {at: 1, fn: "s.stateShown === 1 && s.markP === 1 && s.answersShown.every(v => v === 1) && s.visitOrder.join() === 'partyA,claim,trays,response,calendar' && s.tracerParked", label: 'gather: every section shows its supplied state and its allegation number; the supplied day is marked'},
    {at: 1, fn: "s.truncated.length === 0 && s.labelsClear && s.labelsOffFaces && s.groupsClear && s.inFrame && s.crossed === 0 && s.clashes.length === 0", label: 'layout: nothing cut; labels and components clear; no connector through a third component'},
    {at: 1, params: {relationships: [{from: 'partyA', to: 'claim', kind: 'causal', label: 'causes (as supplied)'}, {from: 'response', to: 'claim', kind: 'relation', label: 'answers'}], traversalOrder: ['partyA', 'claim']}, fn: 's.arrows[0].arrow === true && s.arrows[1].arrow === false', label: 'an arrowhead only on a supplied causal link'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(v => v === 1) && s.stateShown === 1 && s.markP === 1 && s.answersShown.every(v => v === 1)', label: 'labels hidden: the same mechanism (relations, answer numbers, state glyphs, the day mark)'},
    {at: 1, params: {focusElement: 'claim'}, fn: 's.focusScale === 1', label: 'the focus element is back to rest scale at the gather'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.labelsClear && s.clashes.length === 0', label: `${n}: nothing cut; labels clear`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const els = p.elements.map(e => e.label).filter(Boolean); const rel = p.relationships.map(r => r.label || p.relationLabels[r.kind]); return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.claim.title, ...p.documents.claim.allegations, p.documents.response.title, ...p.documents.response.sections.map(s => s.label), ...p.dates.window, p.stages.admitted, p.stages.disputed, ...els, ...rel];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Sequence as configured (illustrative)', 'Secuencia según la configuración (ilustrativa)'];",
});

const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]') && ![...svg.querySelectorAll('[data-node$="-head"]')].some(e => e.closest('[data-node^="rel-c"]') && parseFloat(e.getAttribute('opacity') || '1') > 0))()`;
const STATE_GLYPHS_NEUTRAL = `(() => {
  const hue = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return -1; const n = parseInt(m[1], 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 0.08) return -1; const d = mx - mn; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const green = c => { const h = hue(c); return h >= 75 && h <= 165; };
  const glyphs = [...svg.querySelectorAll('[data-node^="st-bd"]')];
  if (!glyphs.length) return false;
  const shapesOk = glyphs.every(g => [...g.querySelectorAll('path, circle, polyline, line')].every(e => e.tagName === 'circle' || (e.tagName === 'path' && (e.getAttribute('d').match(/[LM]/g) || []).length === 4)));
  return shapesOk && glyphs.flatMap(g => [...g.querySelectorAll('*')]).every(e => !green(e.getAttribute('fill')) && !green(e.getAttribute('stroke'))) && !svg.querySelector('polyline');
})()`;
const EQUAL_WEIGHT = `(() => {
  const gs = [...svg.querySelectorAll('[data-node^="st-bd"]')].map(g => g.firstElementChild);
  if (gs.length < 2) return true;
  const areas = gs.map(e => { const b = e.getBBox(); return e.tagName === 'circle' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2; });
  return new Set(gs.map(e => e.getAttribute('stroke-width'))).size === 1 && Math.max(...areas) / Math.min(...areas) <= 1.3;
})()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;

ratioChecks(ID, 'faces clear, cards own their text, in frame, portraits readable, relation labels by their own connector', [
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, label or text covers a portrait'},
  {at: [0.3, 0.65, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [1], dom: headsAtLeast(80), label: 'portraits readable (>= 80 px at 1080p)'},
  {at: [0.2, 1], dom: fills(0.85, 0.6), label: 'the diagram fills the caption-safe box (once separated, and at the hold)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['rl']), label: 'relation labels beside their connectors (leader <= 40 px), leaders cross no text'},
  {at: [0.45, 1], tv: ['all'], dom: relationLabelsNearest(20), label: 'RENDERED: each relation label is >= 20 px nearer its own connector than any other'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.7, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: STATE_GLYPHS_NEUTRAL, label: 'LEGAL: state glyphs are only ● / ◆ — no ticks or crosses, no green'},
  {at: [1], dom: EQUAL_WEIGHT, label: 'LEGAL: ● and ◆ have equal weight (same stroke, areas within 30 %)'},
  {at: [0.5, 1], dom: NO_ARROWS, label: 'no arrowheads (no causal link is supplied in the presets)'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no portrait is drawn over visible text'},
  {at: times(0.18, 1, 0.02), dom: CONNECTOR_OFF_TEXT, label: 'RENDERED: no connector runs under or over text (every 0.02)'},
  {at: [1], fn: 's.labelsClear && s.labelsOffFaces && s.groupsClear && s.inFrame && s.crossed === 0 && s.truncated.length === 0', label: 'layout: labels and components clear, nothing cut, no connector through a third component'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' ').replace(/\\u00a0/g, ' '); return !/\\b(Party|Day \\d|fictional|Case file|Claim|Initial|Response|Section|Admitted|Disputed|supplied|Calendar|trays?|kept|filed|received|answered|written|dated|Sequence|As supplied|relation|communication)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.65, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a component, a connector or a portrait'},
]);

// thin windows: each answer number rises over >= 120 ms, each pair is lit for >= 200 ms, each relationship is drawn over >= 300 ms
test(`${ID}: thin windows measured — pairing, answer numbers and relationship drawing`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  for (const pr of ALL) {
    const dur = def.defaultParams.durationMs;
    const rows = [];
    for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, params: pr.params, timeMs: t}).semantic);
    const n = rows[0].answersShown.length;
    for (let i = 0; i < n; i++) {
      expect(rows.filter(s => s.answersShown[i] > 0 && s.answersShown[i] < 1).length * 1000 / 60, `${pr.name} answer ${i} fade ms`).toBeGreaterThanOrEqual(120);
      expect(rows.filter(s => s.pairActive === i).length * 1000 / 60, `${pr.name} pair ${i} ms`).toBeGreaterThanOrEqual(200);
    }
    for (let k = 0; k < rows[0].relationsDrawn.length; k++) expect(rows.filter(s => s.relationsDrawn[k] > 0 && s.relationsDrawn[k] < 1).length * 1000 / 60, `${pr.name} relation ${k} draw ms`).toBeGreaterThanOrEqual(300);
  }
});

// DOM-less sweep: every preset × ratio × labels evaluates at every 0.05 of u without error; the order of visits never
// changes on seek (the visits at u are a prefix of the supplied order) and every relationship is drawn by the trace
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    const order = (pr.params.traversalOrder || def.defaultParams.traversalOrder).join();
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(order.startsWith(s.visitOrder.join()), tag).toBe(true);
      if (u >= 0.44) expect(s.relationsDrawn.every(v => v === 1), tag).toBe(true);
      expect(s.arrows.every(a => !a.arrow), tag).toBe(true);
    }
  }
});

// cold create: every preset × ratio in its own fresh page creates and seeks within ~1 s
test(`${ID}: cold create <= 1000 ms in a fresh page, every preset × ratio`, async ({browser, baseURL}) => {
  test.setTimeout(300000);
  const slow = [];
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const page = await browser.newPage({baseURL});
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, params, w2, h2]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.body.appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w2, height: h2, params}); await x.ready; x.seek(x.durationMs * 0.5);
      return performance.now() - t0;
    }, [ID, pr.params, w, h]);
    await page.close();
    if (ms > 1000) slow.push(`${pr.name} ${w}x${h}: ${Math.round(ms)} ms`);
  }
  expect(slow).toEqual([]);
});

// item 20: the stress preset never lowers a count — every array (nested ones included) is at least as long as the
// baseline's
test(`${ID}: long-labels-stress keeps every array at least as long as the baseline (nested arrays included)`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const st = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  const short = [];
  const walk = (b, s, path) => {
    if (Array.isArray(b)) {
      if (Array.isArray(s)) {
        if (s.length < b.length) short.push(`${path}: ${s.length} < ${b.length}`);
        b.forEach((x, i) => { if (s[i] !== undefined) walk(x, s[i], `${path}[${i}]`); });
      }
      return;
    }
    if (b && typeof b === 'object' && s && typeof s === 'object') for (const k of Object.keys(b)) if (k in s) walk(b[k], s[k], `${path}.${k}`);
  };
  walk(def.defaultParams, st, 'params');
  expect(short).toEqual([]);
});
