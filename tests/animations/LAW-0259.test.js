// LAW-0259 — Contestación estructurada · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (the state supplied for the first
// section); no legal consequence is invented to complete the contrast.
// Windows (u): headers 0.17–0.24; the first section's row receives its supplied state 0.24–0.30 (● in A, ◆ in B);
// changed-fact chip 0.28–0.36; action clock c = (u − 0.40) / 0.37 in both scenes (three links: carry c 0.11–0.25,
// 0.40–0.53, 0.69–0.82; pin after each); return c 0.90–1.00; guide markers and chip 0.775–0.83; neutral note 0.80–0.86.
// LEGAL: 'admitted' / 'disputed' are only states supplied for this example. No winner, score, effect, burden,
// consequence or outcome; ● and ◆ have equal weight; no ticks, no green, no arrows.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, CONNECTOR_OFF_TEXT, figuresAtLeast} from './contestacion-estructurada-checks.js';

const ID = 'LAW-0259';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const same = (a, b) => `JSON.stringify(s.${a}) === JSON.stringify(s.${b})`;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'tipA', 'tipB'],
  attach: [
    {from: 0, to: 1, a: 'gripA', b: 'handA', tol: 1.5},
    {from: 0, to: 1, a: 'gripB', b: 'handB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.headers === 0 && s.rowMark === 0 && s.changedShown === 0 && s.drawnA.every(t => t === 0) && s.drawnB.every(t => t === 0)", label: 'base: two identical scenes at rest; nothing is marked yet'},
    {at: 0.32, fn: "s.headers === 1 && s.rowMark === 1 && s.changedShown > 0 && s.drawnA.every(t => t === 0)", label: 'change: headers shown; the first section receives its supplied state in each scene; the changed fact is named'},
    {at: 1, fn: "s.statesA[0] === 'admitted' && s.statesB[0] === 'disputed' && JSON.stringify(s.statesA.slice(1)) === JSON.stringify(s.statesB.slice(1)) && " + same('refersA', 'refersB'), label: 'exactly one fact differs: the state of the first section (A admitted, B disputed); every other state and every link target is identical'},
    ...[0.45, 0.55, 0.65, 0.72].map(u => ({at: u, fn: `${same('drawnA', 'drawnB')} && ${same('badgesA', 'badgesB')}`, label: `u=${u}: the action runs in parallel and identically in both scenes`})),
    ...[0.45, 0.55, 0.65, 0.72].map(u => ({at: u, fn: 's.badgesA.every((b, i) => b === 0 || s.drawnA[i] === 1) && s.badgesB.every((b, i) => b === 0 || s.drawnB[i] === 1)', label: `u=${u}: no state badge before its link is drawn (cause before effect)`})),
    {at: 1, fn: 's.guide === 1 && s.note === 1 && s.drawnA.every(t => t === 1) && s.badgesB.every(t => t === 1) && s.allReached && s.markP === 1', label: 'guide: every thread pinned in both scenes; the guide and the neutral note shown'},
    {at: 1, fn: 's.truncated.length === 0 && s.labelsClear && s.labelsOffFaces', label: 'layout: nothing cut; labels clear of each other and of the faces'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.drawnA.every(t => t === 1) && s.drawnB.every(t => t === 1) && s.statesA[0] !== s.statesB[0]", label: 'labels hidden: the same contrast (both scenes linked; the first thread differs)'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.labelsClear && s.allReached', label: `${n}: nothing cut; labels clear; every hand reaches its target`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.claim.title, ...p.documents.claim.allegations, p.documents.response.title, ...p.documents.response.sections.map(s => s.label), p.stages.admitted, p.stages.disputed, p.scenarioA.label, p.scenarioB.label, ...[p.scenarioA.caption, p.scenarioB.caption].filter(Boolean), p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean);",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
const GLYPHS = '[data-node^="sa-bd"], [data-node^="sb-bd"], [data-node^="rowmark"][data-node$="-g"]';
const STATE_GLYPHS_NEUTRAL = `(() => {
  const hue = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return -1; const n = parseInt(m[1], 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 0.08) return -1; const d = mx - mn; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const green = c => { const h = hue(c); return h >= 75 && h <= 165; };
  const glyphs = [...svg.querySelectorAll('${GLYPHS}')];
  if (!glyphs.length) return false;
  const shapesOk = glyphs.every(g => [...g.querySelectorAll('path, circle, polyline, line')].every(e => e.tagName === 'circle' || (e.tagName === 'path' && (e.getAttribute('d').match(/[LM]/g) || []).length === 4)));
  const els = [...glyphs.flatMap(g => [...g.querySelectorAll('*')]), ...svg.querySelectorAll('[data-node*="-lk"]')];
  return shapesOk && els.every(e => !green(e.getAttribute('fill')) && !green(e.getAttribute('stroke'))) && !svg.querySelector('polyline');
})()`;
const EQUAL_WEIGHT = `(() => {
  const gs = [...svg.querySelectorAll('[data-node^="sa-bd"], [data-node^="sb-bd"]')].map(g => g.firstElementChild);
  if (gs.length < 2) return true;
  const areas = gs.map(e => { const b = e.getBBox(); return e.tagName === 'circle' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2; });
  return new Set(gs.map(e => e.getAttribute('stroke-width'))).size === 1 && Math.max(...areas) / Math.min(...areas) <= 1.3;
})()`;
// only the first section's thread is drawn differently: the dashed (disputed) overlay exists in B's first link and not in
// A's; every other link has the same style in both scenes
const ONE_THREAD_DIFFERS = `(() => {
  const n = svg.querySelectorAll('[data-node^="sa-lk"][data-node$="-line"]').length;
  if (!n) return false;
  for (let i = 0; i < n; i++) {
    const a = Boolean(svg.querySelector('[data-node="sa-lk' + i + '-dash"]')), b = Boolean(svg.querySelector('[data-node="sb-lk' + i + '-dash"]'));
    if (i === 0 ? (a || !b) : a !== b) return false;
  }
  return true;
})()`;
// the one difference reads at every size: each inset's glyph is >= 24 px across at 1080p; A's thread is solid (no dash
// overlay), B's carries the visible dashed overlay; A's glyph a circle, B's a diamond
const INSETS_LEGIBLE = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('inset0-bd'), b = q('inset1-bd');
  if (!a || !b) return false;
  const big = e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) / K >= 24 && eff(e) > 0.9; };
  return big(a) && big(b) && a.querySelector('circle') && !b.querySelector('circle') && !q('inset0-dash') && eff(q('inset1-dash')) > 0.9;
})()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// the guide markers sit off every head and off every text they do not own
const MARKERS_CLEAR = `(() => {
  const R = e => e.getBoundingClientRect();
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const marks = [...svg.querySelectorAll('[data-node^="mark"]')].map(m => m.querySelector('circle')).filter(Boolean);
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"]')];
  const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-node^="mark"]') && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  return marks.length === 2 && marks.every(m => heads.every(h => !meet(R(m), R(h))) && texts.every(t => !meet(R(m), R(t))));
})()`;

ratioChecks(ID, 'two scenes, faces clear, in frame, people readable, exactly one difference', [
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, header, strip item or text covers a head'},
  {at: [0.3, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [1], dom: headsAtLeast(45), label: 'people readable in both scenes (head >= 45 px at 1080p in every preset: the stress floor)'},
  {at: [0, 1], presets: ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'], ratios: ['16:9', '9:16'], dom: headsAtLeast(60), label: 'baseline and contrast presets at 16:9 and 9:16: heads >= 60 px in both scenes (standing people floor)'},
  {at: [1], dom: INSETS_LEGIBLE, label: 'RENDERED: the changed thread is drawn large in both insets — glyphs >= 24 px across, solid ● in A and dashed ◆ in B (labels shown or hidden)'},
  {at: [0, 1], presets: ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'], ratios: ['1:1'], dom: headsAtLeast(55), label: 'baseline presets at 1:1: heads >= 55 px in both scenes (standing people floor, LAW-0171 precedent)'},
  {at: [1], dom: figuresAtLeast(200, '[data-node="sa-pb"], [data-node="sb-pb"]'), label: 'both Party Bs stand >= 200 px tall at 1080p'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the two scenes and the strip fill the caption-safe box (labels shown or hidden)'},
  {at: [1], dom: ONE_THREAD_DIFFERS, label: 'RENDERED: only the first section’s thread is drawn differently (dashed in B); every other thread is identical'},
  {at: [0.85, 1], tv: ['all'], dom: MARKERS_CLEAR, label: 'RENDERED: the guide markers sit off every head and every text'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: STATE_GLYPHS_NEUTRAL, label: 'LEGAL: state glyphs are only ● / ◆ — no ticks or crosses, no green on glyphs or threads'},
  {at: [1], dom: EQUAL_WEIGHT, label: 'LEGAL: ● and ◆ have equal weight (same stroke, areas within 30 %)'},
  {at: [0, 1], dom: NO_ARROWS, label: 'no arrowhead markers'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.4, 0.8, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the pointers and the hands never lie over a head'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: times(0, 1, 0.02), dom: CONNECTOR_OFF_TEXT, label: 'RENDERED: no thread or pointer runs under or over text (every 0.02)'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' ').replace(/\\u00a0/g, ' '); return !/\\b(Party|Day \\d|fictional|Case file|Claim|Initial|Response|Section|Admitted|Disputed|admitted|disputed|supplied|Same in|Changed fact|answers|differ|conclusion|As supplied)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.6, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop, a board, a pointer or a person'},
]);

// thin windows: each state badge rises over >= 150 ms and each thread is drawn over >= 350 ms, in both scenes
test(`${ID}: thin windows measured — badge fade-in and thread draw durations`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  for (const pr of ALL) {
    const dur = def.defaultParams.durationMs;
    const rows = [];
    for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, params: pr.params, timeMs: t}).semantic);
    for (const sc of ['A', 'B']) {
      const n = rows[0][`states${sc}`].length;
      for (let i = 0; i < n; i++) {
        expect(rows.filter(s => s[`badges${sc}`][i] > 0 && s[`badges${sc}`][i] < 1).length * 1000 / 60, `${pr.name} ${sc} badge ${i} fade ms`).toBeGreaterThanOrEqual(150);
        expect(rows.filter(s => s[`drawn${sc}`][i] > 0 && s[`drawn${sc}`][i] < 1).length * 1000 / 60, `${pr.name} ${sc} thread ${i} draw ms`).toBeGreaterThanOrEqual(350);
      }
    }
  }
});

test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(JSON.stringify(s.drawnA), tag).toBe(JSON.stringify(s.drawnB));
      expect(s.statesA[0] === 'admitted' && s.statesB[0] === 'disputed', tag).toBe(true);
      if (u >= 0.8) expect(s.drawnA.every(t => t === 1), tag).toBe(true);
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
