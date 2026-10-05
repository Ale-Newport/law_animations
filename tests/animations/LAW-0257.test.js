// LAW-0257 — Contestación estructurada · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (the thread's end rides the pointer's tip, the
// pointer rides Party B's SOLVED hand) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65 (c = 1 at u = 0.80). Three supplied sections (default), window w = 0.86 / 3 of c:
//   link 0: reach c 0.040–0.112 → u 0.176–0.223; carry c 0.112–0.246 → u 0.223–0.310; pin c 0.246–0.304 → u 0.310–0.347
//   link 1: carry c 0.398–0.533 → u 0.409–0.497; pin → u 0.497–0.534
//   link 2: carry c 0.685–0.819 → u 0.595–0.682; pin → u 0.682–0.720; return c 0.90–0.96 → u 0.735–0.774
//   calendar mark c 0.93–0.99 → u 0.755–0.794; tag c 0.90–0.96; callout u 0.80–0.86.
// LEGAL: 'admitted' / 'disputed' are only states supplied for this example. Nothing shows an effect of admitting or
// disputing, a burden, a consequence or an outcome; ● and ◆ have equal weight; no ticks, no green, no arrows.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, tagsOffProps, TEXT_LINES_VISIBLE, CONNECTOR_OFF_TEXT, figuresAtLeast} from './contestacion-estructurada-checks.js';

const ID = 'LAW-0257';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['hand', 'tip'],
  attach: [
    {from: 0.226, to: 0.307, a: 'tip', b: 'threadEnd', tol: 1.5},
    {from: 0.412, to: 0.494, a: 'tip', b: 'threadEnd', tol: 1.5},
    {from: 0.598, to: 0.679, a: 'tip', b: 'threadEnd', tol: 1.5},
    {from: 0, to: 1, a: 'grip', b: 'hand', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.phase === 'rest' && s.linked === 0 && s.drawn.every(t => t === 0) && s.badges.every(t => t === 0) && s.markP === 0 && s.tags.linked === 0 && s.notes === 0", label: 'rest: both sheets pinned, no link, no state shown'},
    {at: 0.27, fn: "s.phase === 'carry' && s.active === 0 && s.drawn[0] > 0 && s.drawn[0] < 1 && s.badges[0] === 0", label: 'Party B carries the first thread; its state is not shown while it is carried'},
    {at: 0.45, fn: "s.drawn[0] === 1 && s.badges[0] === 1 && s.active === 1 && s.badges[1] === 0", label: 'the first link is pinned and shows its supplied state; the second is being carried'},
    ...[0.2, 0.3, 0.4, 0.5, 0.6, 0.7].map(u => ({at: u, fn: 's.badges.every((b, i) => b === 0 || s.drawn[i] === 1)', label: `u=${u}: no state badge before its link is fully drawn (cause before effect)`})),
    {at: 0.8, fn: "s.linked === s.states.length && s.markP === 1 && s.tags.linked === 1 && s.phase === 'rest' && s.allReached", label: 'every section linked; the supplied response day marked; Party B back at rest'},
    {at: 1, fn: "s.notes === 1 && s.truncated.length === 0 && s.labelsClear && s.labelsOffFaces", label: 'hold: callout shown; nothing cut; labels clear of each other and of the faces'},
    {at: 1, fn: "s.states[0] === 'admitted' && s.refers.every((r, i) => r === i)", label: 'default: section 1 admitted (finalState), each section refers to its own allegation (as supplied)'},
    {at: 1, params: {finalState: 'disputed'}, fn: "s.states[0] === 'disputed' && s.linked === s.states.length", label: 'finalState disputed: the first link shows the dashed disputed marker; nothing else changes'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.linked === s.states.length && s.badges.every(b => b === 1) && s.markP === 1', label: 'labels hidden: the same transformation (every thread pinned with its state glyph, the day marked)'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && s.linked < s.states.length && s.tags.linked === 0 && s.notes === 0', label: 'actionProgress freezes the action part-way (no completion tag, no callout)'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached && s.linked === s.states.length', label: `${n}: no supplied text is cut; every thread pinned`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const secs = p.documents.response.sections; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.claim.title, ...p.documents.claim.allegations, p.documents.response.title, ...secs.map(s => s.label), ...p.dates.window, p.stages.admitted, p.stages.disputed, p.stages.linked, p.objectLabels.calendar, p.objectLabels.claimTray, p.objectLabels.responseTray, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const TAGS_OFF_PROPS = tagsOffProps(['st-cf', 'st-cal', 'st-tc-back', 'st-tc-front', 'st-tr-back', 'st-tr-front', 'st-cl', 'st-rs']);
// the "no directed arrows" rule: no arrowhead markers
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
// legal: the admitted state never looks like approval — the state glyphs are only ● (circle) and ◆ (four-point
// diamond), no tick or cross path, and no green fill or stroke on the glyphs or the threads (hue 75°–165°)
const STATE_GLYPHS_NEUTRAL = `(() => {
  const hue = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return -1; const n = parseInt(m[1], 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 0.08) return -1; const d = mx - mn; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const green = c => { const h = hue(c); return h >= 75 && h <= 165; };
  const glyphs = [...svg.querySelectorAll('[data-node^="st-bd"]')];
  if (!glyphs.length) return false;
  const shapesOk = glyphs.every(g => [...g.querySelectorAll('path, circle, polyline, line')].every(e => e.tagName === 'circle' || (e.tagName === 'path' && (e.getAttribute('d').match(/[LM]/g) || []).length === 4)));
  const els = [...glyphs.flatMap(g => [...g.querySelectorAll('*')]), ...svg.querySelectorAll('[data-node*="-lk"]')];
  return shapesOk && els.every(e => !green(e.getAttribute('fill')) && !green(e.getAttribute('stroke'))) && !svg.querySelector('polyline');
})()`;
// legal: ● and ◆ have equal weight (same stroke width; areas within 30 % of each other)
const EQUAL_WEIGHT = `(() => {
  const gs = [...svg.querySelectorAll('[data-node^="st-bd"]')].map(g => g.firstElementChild);
  if (gs.length < 2) return true;
  const areas = gs.map(e => { const b = e.getBBox(); return e.tagName === 'circle' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2; });
  const sw = new Set(gs.map(e => e.getAttribute('stroke-width')));
  return sw.size === 1 && Math.max(...areas) / Math.min(...areas) <= 1.3;
})()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;

ratioChecks(ID, 'faces clear, cards own their text, in frame, people large, tags beside their elements', [
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or text covers a head'},
  {at: [0, 0.35, 0.6, 0.7, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [1], presets: ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'], dom: headsAtLeast(52), label: 'people are large enough to read (head >= 52 px at 1080p, the LAW-0249 story floor)'},
  {at: [1], presets: ['long-labels-stress'], ratios: ['16:9', '9:16'], dom: headsAtLeast(52), label: 'long-labels-stress: head >= 52 px at 16:9 and 9:16'},
  // coordinator decision (standing stress rule, AUTHORING item 20, 2026-09-26; see the stress preset's description): at
  // 1:1 the stress text column's width bounds the stage — the LAW-0251 / LAW-0447 stress floor applies
  {at: [1], presets: ['long-labels-stress'], ratios: ['1:1'], dom: headsAtLeast(45), label: 'long-labels-stress at 1:1: head >= 45 px (stress floor, capped preset; coordinator decision item 20)'},
  {at: [1], dom: figuresAtLeast(230), label: 'Party B stands >= 230 px tall at 1080p (people floor on figure height)'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box at rest and hold (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-', 'note']), label: 'each tag sits beside its own element (leader <= 40 px) and its leader crosses no text'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: STATE_GLYPHS_NEUTRAL, label: 'LEGAL: state glyphs are only ● / ◆ — no ticks or crosses, no green on glyphs or threads'},
  {at: [1], dom: EQUAL_WEIGHT, label: 'LEGAL: ● and ◆ have equal weight (same stroke, areas within 30 %)'},
  {at: [0, 1], dom: NO_ARROWS, label: 'no arrowhead markers'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: [0.77, 0.8, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no stage tag intersects any prop or any text (when it appears and at the hold)'},
  {at: [1], presets: ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'], ratios: ['16:9', '9:16'], fn: '!s.textColumn', label: 'baseline and contrast presets: no text-column fallback at 16:9 and 9:16'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.15, 0.8, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the pointer and the hands never lie over a head'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: times(0, 1, 0.02), dom: CONNECTOR_OFF_TEXT, label: 'RENDERED: no thread or pointer runs under or over text (every 0.02)'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

// thin windows: no state glyph blinks in — each rises over >= 150 ms, each thread is drawn over >= 400 ms
test(`${ID}: thin windows measured — badge fade-in and thread draw durations`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  for (const pr of ALL) {
    const dur = def.defaultParams.durationMs;
    const rows = [];
    for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, params: pr.params, timeMs: t}).semantic);
    const n = rows[0].states.length;
    for (let i = 0; i < n; i++) {
      const fade = rows.filter(s => s.badges[i] > 0 && s.badges[i] < 1).length * 1000 / 60;
      const draw = rows.filter(s => s.drawn[i] > 0 && s.drawn[i] < 1).length * 1000 / 60;
      expect(fade, `${pr.name} badge ${i} fade ms`).toBeGreaterThanOrEqual(150);
      expect(draw, `${pr.name} thread ${i} draw ms`).toBeGreaterThanOrEqual(400);
    }
  }
});

// with only locale "es", every default text is shown in Spanish: no English default remains
ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' ').replace(/\\u00a0/g, ' '); return !/\\b(Party|Day \\d|fictional|Case file|Claim|Initial|Response|Section|Admitted|Disputed|admitted|disputed|supplied|Calendar|tray|linked|allegation|As supplied)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

// every line of every visible label is drawn whole and on top
ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.5, 0.7, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop, the board, the pointer or a person'},
]);

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

// DOM-less sweep: every preset × ratio × labels (all / key / none) evaluates at every 0.05 of u; nothing is cut, labels
// stay clear of each other and of the faces, and every thread is pinned by the hold
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
      if (u >= 0.8) expect(s.linked, tag).toBe(s.states.length);
    }
  }
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
