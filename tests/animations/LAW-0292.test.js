// LAW-0292 — Interrogatorio directo · inspect. Contract battery + the full lens checklist (AUTHORING line 109) rendered.
// acceptanceCheck (brief): the detail keeps its source coordinates (a real enlarged copy of the same room), the change is
// localised (one turn's supplied form; only its cue follows), and seeking back restores the old datum.
// Timing (u): build 0–0.20 · frame 0.18–0.205, panel out, context copy out with the lens copy in, context steps back
// 0.209–0.235, lens opens 0.212–0.24 (later when the stepping-back context has not cleared the window yet) · strike
// 0.46–0.50 · dock 0.51–0.55 · new value 0.555–0.585 · cue 0.60–0.64 · close 0.728–0.744, forward, context copy in ·
// panel in 0.765–0.79 · marker 0.80–0.83.
// Legal: open question / bounded answer / not marked are supplied forms only; nothing is assessed (no examination rule,
// objection, admissibility, credibility, weight or outcome). People floors (coordinator): >= 60 px off 1:1; >= 55 px at
// 1:1 for every preset except long-labels-stress (>= 45 px); context people >= 45 px while the lens is open.
// coordinator decision (AUTHORING item 20): long-labels-stress is capped with its true driver and rendered before/after
// numbers recorded in the presets file (`coordinatorDecision`); the pre-cap preset is kept in production/scratch/hearings-03/.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {examinationFreeTest, ES_WORDS, FLOOR_FOR} from './interrogatorio-directo-checks.js';

const ID = 'LAW-0292';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.cueState === 'plain'", label: 'build: the context at full size, the supplied before value on the card (neutral cue); no lens'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoomVsRest >= 1.5 && s.ctxCopy === 0 && s.lensCopy === 1 && !s.bothCopies && s.panel === 0', label: 'isolate: a real enlargement (>= 1.5x the context at rest) holds the datum; the context copy is hidden; the panel is out'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.docked === 0 && s.cueState === 'plain'", label: 'substitute: the old value is struck through before anything else changes'},
    {at: 0.59, fn: "s.datum === 'after' && s.docked === 1 && s.newShown === 1 && s.cueState === 'plain'", label: 'the new value comes before its dependent cue changes'},
    {at: 0.7, fn: "s.cueState === 'open' && s.lensOpen === 1", label: 'then only the dependent cue follows (neutral → ● open question)'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.docked === 1 && s.panel === 1 && s.problems.length === 0", label: 'hold: new value, struck old value docked, marker; the composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.docked === 0 && s.cueState === 'plain'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.before === 'bounded' && s.after === 'plain' && s.cueState === 'plain'", label: 'another supplied pair: bounded answer → answer not marked (◆ → neutral); nothing else is inferred'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.cueState === 'open' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.afterValue, p.beforeValue, p.labels.sequence, p.labels.key, p.contextLabels.context, p.contextLabels.marker];",
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.afterValue];',
  captions: 'return [p.labels.sequence, p.contextLabels.context];',
});

ratioChecks(ID, 'lens sequencing: one copy at a time, panel never with the lens, new value still, sequenced return', [
  {at: times(0.2, 0.3, 0.0025), fn: '!s.bothCopies', label: 'open: the two copies of the datum are never both shown'},
  {at: times(0.7, 0.8, 0.0025), fn: '!s.bothCopies', label: 'close: the two copies of the datum are never both shown'},
  {at: times(0.2, 0.82, 0.005), fn: 's.panel < 0.02 || s.lensOpen < 0.01', label: 'the text panel and the lens are never shown together'},
  {at: [0.59, 0.62, 0.65, 0.68, 0.71], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [0.3, 0.45, 0.6, 0.7], fn: 's.zoomVsRest >= 1.5 && s.lensMinSide >= 0.37', label: 'the lens magnifies >= 1.5x (model) and its smaller side >= 0.37 of the frame short side (model)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// Rendered lens checklist (every preset × ratio × labels shown and hidden): smaller side >= 0.37 of the short side;
// magnification >= 1.5 against the context at REST measured on the card and on the datum TEXT; the context stays a
// real, visible scene (never overlapped, >= 0.45 share); nothing the rim would cut is drawn; no person in the lens;
// one copy of the datum at a time, the lens copy legible within 200 ms of the context copy leaving (open and close);
// panel never with the lens.
test(`${ID}: rendered lens: smaller side, magnification vs rest (card and text), context kept, crop pieces whole, copies sequenced`, async ({page}) => {
  test.setTimeout(900000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const s0 = svg.getScreenCTM().a;
    const fw = w * s0, fh = h * s0;
    const scaleOf = e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); };
    x.seek(0.1 * x.durationMs);
    const sem0 = x.getState({bounds: false}).semantic;
    const card = [...svg.querySelectorAll('[data-node^="rm-card"]')].find(e => /^rm-card\\d$/.test(e.getAttribute('data-node')) && e.querySelector('[data-node$="-g-before"]') && e.querySelector('[data-node$="-g-after"]'));
    if (!card) { out.push(tag + ': no focus card'); return out; }
    const N = card.getAttribute('data-node');
    const fi = N.slice(7);
    const restCard = box(node(svg, N + '-body')).w;
    const t0 = node(svg, N + '-v-before-text'); void sem0;
    const restText = t0 ? parseFloat(getComputedStyle(t0).fontSize) * scaleOf(t0) : null;
    for (const u of [0.32, 0.4, 0.5, 0.6, 0.7]) {
      x.seek(u * x.durationMs);
      const L = box(node(svg, 'lens-bg'));
      const side = Math.min(L.w, L.h) / Math.min(fw, fh);
      stat('lens side / short side ' + ratio, Math.round(side * 1000) / 1000);
      if (side < 0.37) out.push(tag + ' u=' + u + ': lens smaller side ' + side.toFixed(3) + ' of the short side');
      const lzc = node(svg, 'lz-card' + fi + '-body');
      const mag = lzc ? box(lzc).w / restCard : 0;
      stat('magnification vs rest (card) ' + ratio, Math.round(mag * 100) / 100);
      if (mag < 1.5) out.push(tag + ' u=' + u + ': lens card ÷ card at rest = ' + mag.toFixed(2));
      const sem = x.getState({bounds: false}).semantic;
      const lt = node(svg, 'lz-card' + fi + '-v-before-text'); void sem;
      if (restText && lt) { const tm = parseFloat(getComputedStyle(lt).fontSize) * scaleOf(lt) / restText; stat('magnification vs rest (text) ' + ratio, Math.round(tm * 100) / 100); if (tm < 1.5) out.push(tag + ' u=' + u + ': datum text ×' + tm.toFixed(2)); }
      const C = box(node(svg, 'rm-walls'));
      if (hit(C, L, 1)) out.push(tag + ' u=' + u + ': the lens overlaps the context room');
      const cw = C.w / fw, ch = C.h / fh;
      stat('context width share ' + ratio, Math.round(cw * 1000) / 1000);
      const portrait = h > w * 1.2;
      if (portrait) {
        const span = (Math.max(C.r, L.r) - Math.min(C.l, L.l)) / fw;
        stat('portrait context+lens span (width) ' + ratio, Math.round(span * 1000) / 1000);
        if (Math.max(cw, ch) < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(2) + ' × ' + ch.toFixed(2) + ' of the frame');
        if (span < 0.8) out.push(tag + ' u=' + u + ': context + lens span ' + span.toFixed(2) + ' of the width');
      } else if (cw < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(3) + ' of the frame width');
      // every piece drawn in the lens lies wholly inside its window (walls, floor and the table excepted)
      for (const e of svg.querySelectorAll('[data-node^="lz-"]')) {
        const nm = e.getAttribute('data-node');
        if (!/^lz-(p\\d|chair\\d|card\\d|table|cabinet|exhibit\\d|clock|lectern|slipwrap\\d|wchair)$/.test(nm)) continue;
        if (eff(svg, e) < 0.05) continue;
        const b = box(e);
        if (b.w < 1) continue;
        if (b.l < L.l - 1 || b.r > L.r + 1 || b.t < L.t - 1 || b.b > L.b + 1) out.push(tag + ' u=' + u + ': ' + nm + ' is cut by the lens rim');
      }
      if (nodes(svg, /^lz-p\\d$/).length) out.push(tag + ': a person is drawn in the lens');
    }
    // one copy at a time at 60 fps; the lens copy arrives within 200 ms of the context copy leaving (open and close)
    const copies = pre => [...svg.querySelectorAll('[data-node^="' + pre + '-card' + fi + '-v-"]')].filter(e => /-v-(before|after)$/.test(e.getAttribute('data-node')) && e.querySelector('text'));
    let gapRun = 0, worstGap = 0, both = 0;
    for (let ms = 0.2 * x.durationMs; ms <= 0.82 * x.durationMs; ms += 1000 / 60) {
      x.seek(ms);
      const c = Math.max(0, ...copies('rm').map(e => eff(svg, e)));
      const l = Math.max(0, ...copies('lz').map(e => eff(svg, e)));
      if (c >= 0.15 && l >= 0.15) both++;
      gapRun = c < 0.15 && l < 0.15 ? gapRun + 1000 / 60 : 0;
      worstGap = Math.max(worstGap, gapRun);
      if (eff(svg, node(svg, 'lens')) > 0.02 && eff(svg, node(svg, 'panel')) > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: panel and lens shown together');
    }
    if (copies('rm').length) {
      stat('worst copy hand-over gap ms ' + ratio, Math.round(worstGap), 'max');
      if (both) out.push(tag + ': both copies >= 0.15 in ' + both + ' frames');
      if (worstGap > 200) out.push(tag + ': no copy of the datum legible for ' + Math.round(worstGap) + ' ms');
    }
    return out;`, {}, {withHidden: true});
  report(ID, 'lens', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The lens window (shadow, background, rim) never intersects a head at any opacity above 0 (60 fps).
test(`${ID}: the lens window never intersects a head at any opacity > 0 (60 fps, every preset × ratio × labels)`, async ({page}) => {
  test.setTimeout(900000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const lens = node(svg, 'lens');
    let frames = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      if (eff(svg, lens) <= 0) continue;
      frames++;
      const Ls = ['lens-shadow', 'lens-bg', 'lens-rim'].map(n => box(node(svg, n)));
      const L = {l: Math.min(...Ls.map(q => q.l)), t: Math.min(...Ls.map(q => q.t)), r: Math.max(...Ls.map(q => q.r)), b: Math.max(...Ls.map(q => q.b))};
      for (const hd of nodes(svg, /^rm-p\\d-head$/)) {
        if (eff(svg, hd) <= 0) continue;
        if (discHits(headCircle(hd), L, 0)) out.push(pr.name + ' ' + ratio + ' u=' + (ms / x.durationMs).toFixed(4) + ': lens (opacity ' + eff(svg, lens).toFixed(2) + ') over ' + hd.getAttribute('data-node'));
      }
    }
    stat('lens frames checked ' + ratio, frames, 'max');
    return out;`, {}, {withHidden: true});
  report(ID, 'lens over heads', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Context text at full opacity at rest (u 0 until the lens opens): the floor fade only acts while the context steps back.
test(`${ID}: the context's datum and card texts are fully opaque at rest, before the lens opens (every preset × ratio, es-only too)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const {bad, worst} = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    let worst = 1;
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); } return o; };
      for (const u of [0, 0.05, 0.1, 0.15, 0.18, 0.2]) {
        x.seek(u * x.durationMs);
        const ts = [...svg.querySelectorAll('[data-node^="rm-card"][data-node$="-text"]')].filter(t => !/-v-(before|after)-text$/.test(t.getAttribute('data-node')) || t.getAttribute('data-node').endsWith('-v-before-text'));
        for (const t of ts) { const op = eff(t); worst = Math.min(worst, op); if (op < 0.999) out.push(`${pr.name} ${ratio} u=${u}: ${t.getAttribute('data-node')} opacity ${op.toFixed(3)}`); }
      }
      x.destroy(); el.remove();
    }
    return {bad: [...new Set(out)].slice(0, 20), worst};
  }, [ID, presets]);
  console.log(`[hearings-03] ${ID} rest context text: min opacity ${worst}`);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Through the hold the new value, the docked struck old value ("was") and the Δ stay fully visible.
ratioChecks(ID, 'value traceable at the hold', [
  {at: times(0.87, 1, 0.01), tv: ['all'], dom: "(() => { const fi = [...svg.querySelectorAll('[data-node$=\"-dock\"]')].map(e => e.getAttribute('data-node')).find(n => n.startsWith('rm-card')); if (!fi) return false; const N = fi.replace(/-dock$/, ''); const e = n => svg.querySelector('[data-node=\"' + n + '\"]'); const op = el => { let o = 1; for (let q = el; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; }; return op(e(N + '-dock')) > 0.95 && op(e(N + '-was')) > 0.95 && op(e('cx-marker')) > 0.95; })()", label: 'rendered: at the hold the docked old value, its "was" and the Δ marker are fully visible'},
]);

const CHIPS = ['[data-node="b0"]', '[data-node="b1"]', '[data-node="b2"]', '[data-node="b3"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: [...CHIPS, '[data-node="lens-bg"]']});
noOverlapTest(ID, {markers: [...CHIPS, '[data-node="cx-marker"]', '[data-node="src-frame"]', '[data-node$="-dock"]'], opaque: ['[data-node="lens"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {lens: [0.21, 0.8], floorFor: 'if (inLens) return 45; ' + FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="lens-bg"]', '[data-node="cx-marker"]', '[data-node$="-dock"]']});
equalWeightTest(ID, {at: [0.1, 1], marks: [['[data-node="lg-bounded"] path:first-of-type', '[data-node="lg-open"] circle']]});
neutralityTest(ID);
examinationFreeTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.3, 0.5, 0.62, 0.76, 0.9, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]', at: [0.05, 1]});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="src-frame"]']});
textLinesVisibleTest(ID);

// Preset consistency (coordinator, hearings-03): the focused statement's OWN supplied form is the before-state (a
// question for "open", an answer for "bounded"), and a marker that names an ordinal ("the third turn", "el tercer turno")
// names the focused turn; the rendered marker row is exactly that supplied text and the rendered before-state matches.
test(`${ID}: every preset's marker names the focused turn and its before-state matches the statement's own form`, async ({page}) => {
  const ORD = [['first', 'primer'], ['second', 'segund'], ['third', 'tercer'], ['fourth', 'cuart'], ['fifth', 'quint'], ['sixth', 'sext']];
  const DEF = {statements: [{kind: 'question', form: 'open'}, {kind: 'answer', form: 'bounded'}, {kind: 'question', form: 'plain'}, {kind: 'answer', form: 'plain'}], focusItem: 2, beforeState: 'plain', marker: 'Changed: one supplied datum, the form of the third turn'};
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = [];
  for (const pr of presets) {
    const q = pr.params;
    const sts = q.statements || DEF.statements;
    const fi = q.focusItem ?? DEF.focusItem;
    const st = sts[fi];
    const before = q.beforeState ?? DEF.beforeState;
    if (!st) { bad.push(`${pr.name}: focusItem ${fi} is not a turn`); continue; }
    if ((st.form || 'plain') !== before) bad.push(`${pr.name}: statement ${fi} form "${st.form}" but beforeState "${before}"`);
    if (before === 'open' && st.kind !== 'question') bad.push(`${pr.name}: "open" on an answer`);
    if (before === 'bounded' && st.kind !== 'answer') bad.push(`${pr.name}: "bounded" on a question`);
    const marker = (q.contextLabels && q.contextLabels.marker) || DEF.marker;
    ORD.forEach((words, j) => { if (words.some(w => new RegExp(`\\b${w}`, 'i').test(marker)) && j !== fi) bad.push(`${pr.name}: marker "${marker}" names turn ${j + 1}, focus is ${fi + 1}`); });
  }
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const rendered = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1920, height: 1080, params: pr.params});
      await x.ready; x.seek(x.durationMs);
      const row = x.element.querySelector('[data-node="marker-row"]');
      const s = x.getState({bounds: false}).semantic;
      out.push({name: pr.name, marker: row ? row.textContent.replace(/\s+/g, '') : null, before: s.before, focus: s.focusItem, markerText: s.markerText});
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  for (const r0 of rendered) {
    const q = presets.find(p => p.name === r0.name).params;
    const want = (q.contextLabels && q.contextLabels.marker) || DEF.marker;
    // (wrapped lines are separate tspans: compared without whitespace)
    if (r0.marker !== want.replace(/\s+/g, '')) bad.push(`${r0.name}: rendered marker "${r0.marker}" is not the supplied "${want}"`);
    if (r0.before !== (q.beforeState ?? DEF.beforeState)) bad.push(`${r0.name}: rendered before-state ${r0.before}`);
    if (r0.focus !== (q.focusItem ?? DEF.focusItem)) bad.push(`${r0.name}: rendered focus ${r0.focus}`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// Stress strictly longer than baseline (coordinator, AUTHORING item 20): every supplied text of long-labels-stress is
// longer than the same field in the defaults (a field the stress preset leaves out falls back to the default: equal).
test(`${ID}: long-labels-stress — every text field is strictly longer than its baseline (default) counterpart`, async () => {
  const def = (await import('../../src/animations/hearings/LAW-0292.js')).default;
  const base = def.defaultParams;
  const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  // (enumerations and the common controls are not texts)
  const ENUMS = new Set(['kind', 'form', 'beforeState', 'focusTarget', 'placement', 'id', 'locale', 'textVisibility', 'theme', 'palette', 'background', 'jurisdiction', 'aspectRatio', 'instanceId']);
  const bad = [];
  const walk = (d, s0, path) => {
    if (typeof d === 'string') {
      if (ENUMS.has(path.split('.').pop())) return;
      if (typeof s0 !== 'string') bad.push(`${path}: missing in the stress preset (falls back to "${d}")`);
      else if (s0.length <= d.length) bad.push(`${path}: ${s0.length} <= ${d.length} ("${s0}")`);
      return;
    }
    if (d && typeof d === 'object') for (const k of Object.keys(d)) walk(d[k], s0 ? s0[k] : undefined, path ? `${path}.${k}` : k);
  };
  walk(base, stress, '');
  expect(bad, bad.join('\n')).toEqual([]);
});
