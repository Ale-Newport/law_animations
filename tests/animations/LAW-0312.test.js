// LAW-0312 — Pausa de audiencia · inspect. Contract battery + the full lens checklist (AUTHORING line 109) rendered.
// acceptanceCheck (brief): the detail keeps its source coordinates (a real enlarged copy of the same room), the change is
// localised (one supplied datum, the recess time; only its dependent geometry follows: the session clock's hands, the
// card's dial and the connector), and seeking back restores the old datum.
// Timing (u): build 0–0.20 · frame 0.18–0.205, panel out, context copy out with the lens copy in, context steps back,
// lens opens · the old value moves, unchanged (no strike), to its dock 0.48–0.55 · new value 0.555–0.585 · the hands, the
// card's dial and the connector follow 0.60–0.68 · close 0.728–0.744, forward, context copy in · panel in 0.744–0.762 (the
// panel leaves as the lens starts to open, 0.018 before it) · marker 0.80–0.83. The wall clock runs throughout.
// Legal: the time is only a supplied, fictional time; no rule on recesses, duration, time limit, consequence or end of
// the proceedings; neither value is marked as wrong (no strike, no red, no warning); jurisdiction unspecified.
// Lens (coordinator): magnification >= 1.5x on the text at every host (sized hosts too; target 1.6x); the smaller side
// >= 0.35 of the short side (with margin: 0.37 measured); the visible context >= 0.45; nothing cut by the rim (the
// connector included in the crop pieces); the panel and the lens never together and never both nearly invisible for
// more than 150 ms (60 fps); one copy of the datum at a time. People floors (coordinator; hearings measure the FIGURE
// height): >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45 px); context people >= 45 px while the lens
// is open.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest as stressLongerWalker, esSuppliedTagTest, pauseConsistencyTest, glyphStateTest, noTwinTextTest, positionsKeptTest, glyphFollowsStateTest, ES_WORDS, FLOOR_FOR} from './pausa-audiencia-checks.js';

const ID = 'LAW-0312';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.timeState === 'before'", label: 'build: the context at full size (the clock paused, the recess card connected), the supplied before value on the caption; no lens'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoomVsRest >= 1.5 && s.ctxCopy === 0 && s.lensCopy === 1 && !s.bothCopies && s.panel === 0', label: 'isolate: a real enlargement (>= 1.5x the context at rest) holds the datum; the context copy is hidden; the panel is out'},
    {at: 0.5, fn: "s.datum === 'changing' && s.strike === 0 && s.docked > 0 && s.timeState === 'before'", label: 'substitute: the old value moves, unchanged and never struck, to its dock before anything else changes'},
    {at: 0.59, fn: "s.datum === 'after' && s.docked === 1 && s.newShown === 1 && s.timeState === 'before' && s.strike === 0", label: 'the new value comes before its dependent geometry changes'},
    {at: 0.7, fn: "s.timeState === 'after' && s.lensOpen === 1", label: 'then only the dependent geometry follows (the hands, the card\'s dial and the connector)'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.docked === 1 && s.panel === 1 && s.strike === 0 && s.problems.length === 0", label: 'hold: new value, the old value docked (traceable, not struck), marker; the composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.docked === 0 && s.timeState === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.timeBefore === '14:05' && s.timeAfter === '13:50' && s.timeState === 'after'", label: 'another supplied pair: 14:05 → 13:50; nothing else is inferred'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.timeState === 'after' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'active').map(s => s.text), ...p.exhibits, p.afterValue, p.beforeValue, p.states.active, p.states.recess, p.labels.positions, p.labels.sequence, p.labels.key, p.contextLabels.context, p.contextLabels.marker];",
  content: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'active').map(s => s.text), ...p.exhibits, p.afterValue];",
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
    const card = node(svg, 'rm-cap');
    if (!card) { out.push(tag + ': no caption plate'); return out; }
    const restCard = box(node(svg, 'rm-cap-body')).w;
    const t0 = node(svg, 'rm-cap-v-before-text'); void sem0;
    const restText = t0 ? parseFloat(getComputedStyle(t0).fontSize) * scaleOf(t0) : null;
    for (const u of [0.32, 0.4, 0.5, 0.6, 0.7]) {
      x.seek(u * x.durationMs);
      const L = box(node(svg, 'lens-bg'));
      const side = Math.min(L.w, L.h) / Math.min(fw, fh);
      stat('lens side / short side ' + ratio, Math.round(side * 1000) / 1000);
      if (side < 0.37) out.push(tag + ' u=' + u + ': lens smaller side ' + side.toFixed(3) + ' of the short side');
      const lzc = node(svg, 'lz-cap-body');
      const mag = lzc ? box(lzc).w / restCard : 0;
      stat('magnification vs rest (card) ' + ratio, Math.round(mag * 100) / 100);
      // (coordinator: >= 1.5x on the text at every host; 1.6x is the robustness target)
      const minMag = 1.5;
      if (mag < minMag) out.push(tag + ' u=' + u + ': lens card ÷ card at rest = ' + mag.toFixed(2));
      const sem = x.getState({bounds: false}).semantic;
      const lt = node(svg, 'lz-cap-v-before-text'); void sem;
      if (restText && lt) { const tm = parseFloat(getComputedStyle(lt).fontSize) * scaleOf(lt) / restText; stat('magnification vs rest (text) ' + ratio, Math.round(tm * 100) / 100); if (tm < minMag) out.push(tag + ' u=' + u + ': datum text ×' + tm.toFixed(2)); }
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
        if (!/^lz-(p\\d|pin\\d|chair\\d|cap|dock|was|zcopy-before|zcopy-after|tethers|sclock|pause|tag|table|cabinet|exhibit\\d|clock|lectern)$/.test(nm)) continue;
        if (eff(svg, e) < 0.05) continue;
        const b = box(e);
        if (b.w < 1) continue;
        if (b.l < L.l - 1 || b.r > L.r + 1 || b.t < L.t - 1 || b.b > L.b + 1) out.push(tag + ' u=' + u + ': ' + nm + ' is cut by the lens rim');
      }
      if (nodes(svg, /^lz-p\\d$/).length) out.push(tag + ': a person is drawn in the lens');
    }
    // one copy at a time at 60 fps; the lens copy arrives within 200 ms of the context copy leaving (open and close)
    const copies = pre => [...svg.querySelectorAll('[data-node^="' + pre + '-cap-v-"]')].filter(e => /-v-(before|after)$/.test(e.getAttribute('data-node')) && e.querySelector('text'));
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
        const ts = [...svg.querySelectorAll('[data-node="rm-tag-text"], [data-node="rm-cap-v-before-text"]')];
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
  {at: times(0.87, 1, 0.01), tv: ['all'], dom: "(() => { const e = n => svg.querySelector('[data-node=\"' + n + '\"]'); if (!e('rm-dock')) return false; const op = el => { let o = 1; for (let q = el; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; }; return op(e('rm-dock')) > 0.95 && op(e('rm-was')) > 0.95 && op(e('rm-cap-v-before')) > 0.95 && op(e('cx-marker')) > 0.95; })()", label: 'rendered: at the hold the docked old value, its "was" and the Δ marker are fully visible'},
]);

// Panel ↔ lens hand-over (coordinator, item 19 and the lens checklist): measured at 60 fps through the open (u 0.15–0.32)
// and the return (u 0.70–0.82), the freed area is never blank — the text panel and the lens both below 0.3 opacity — for
// more than 150 ms (every preset × ratio, labels shown: the panel exists).
test(`${ID}: panel ↔ lens hand-over — never both below 0.3 opacity for more than 150 ms (60 fps, open and return)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    for (const [phase, u0, u1] of [['open', 0.15, 0.32], ['return', 0.7, 0.82]]) {
      let run = 0, worst = 0;
      for (let ms = u0 * x.durationMs; ms <= u1 * x.durationMs; ms += 1000 / 60) {
        x.seek(ms);
        const blank = eff(svg, node(svg, 'panel')) < 0.3 && eff(svg, node(svg, 'lens')) < 0.3;
        run = blank ? run + 1000 / 60 : 0;
        worst = Math.max(worst, run);
      }
      stat('worst blank ms ' + phase + ' ' + ratio, Math.round(worst), 'max');
      if (worst > 150) out.push(tag + ' ' + phase + ': panel and lens both below 0.3 for ' + Math.round(worst) + ' ms');
    }
    return out;`, {}, {withHidden: false});
  report(ID, 'panel-lens hand-over', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

const CHIPS = ['[data-node="b0"]', '[data-node="b1"]', '[data-node="b2"]', '[data-node="b3"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: [...CHIPS, '[data-node="lens-bg"]']});
noOverlapTest(ID, {markers: [...CHIPS, '[data-node="cx-marker"]', '[data-node="src-frame"]', '[data-node$="-dock"]'], opaque: ['[data-node="lens"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {lens: [0.21, 0.8], floorFor: 'if (inLens) return 45; ' + FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="lens-bg"]', '[data-node="cx-marker"]', '[data-node$="-dock"]']});
equalWeightTest(ID, {at: [0.1, 1], marks: [['[data-node="lg-recess"] path:first-of-type', '[data-node="lg-active"] circle'], ['[data-node="rm-cap-g"]', '[data-node="rm-tagplate-g2"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerWalker(ID);
esSuppliedTagTest(ID);
pauseConsistencyTest(ID, {capField: q => q.beforeValue});
glyphStateTest(ID, {prefixes: ['rm', 'lz'], at: [0.1, 0.7, 1]});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.3, 0.5, 0.62, 0.76, 0.9, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]', at: [0.05, 1]});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="src-frame"]']});
textLinesVisibleTest(ID);
// (the context steps back and returns: everybody keeps their place in the room; the hands turn forward smoothly when the
// time is substituted — at most 10° per frame — and the wall clock runs throughout)
positionsKeptTest(ID, {maxStep: 10});

// Preset consistency: every preset's before and after values differ and carry their times; the before value is the
// supplied recess caption; rendered, the card's dial shows the supplied time before and the alternative after, the
// session clock's minute hand and the connector follow, and the marker row names the supplied marker.
test(`${ID}: every preset substitutes one recess time by another; the rendered dial, hands, connector and marker follow`, async ({page}) => {
  const def = (await import('../../src/animations/hearings/LAW-0312.js')).default;
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = [];
  const tt = t => `${t.hour}:${String(t.minute).padStart(2, '0')}`;
  for (const pr of presets) {
    const q = {...def.defaultParams, ...pr.params};
    if (q.beforeValue === q.afterValue) bad.push(`${pr.name}: the before and after values are the same`);
    if (tt(q.afterTime) === tt(q.clock)) bad.push(`${pr.name}: the alternative time is the time`);
    if (!q.afterValue.includes(tt(q.afterTime))) bad.push(`${pr.name}: the after value "${q.afterValue}" does not carry ${tt(q.afterTime)}`);
    const it = q.statements.find(st => st.kind === 'recess');
    if (!it || it.text !== q.beforeValue) bad.push(`${pr.name}: the before value "${q.beforeValue}" is not the supplied recess caption`);
  }
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const rendered = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1920, height: 1080, params: pr.params});
      await x.ready;
      const svg = x.element;
      const op = e => { if (!e) return 0; let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      const q2 = n => op(svg.querySelector('[data-node="' + n + '"]'));
      const attr = (n, a) => svg.querySelector('[data-node="' + n + '"]').getAttribute(a);
      x.seek(0.1 * x.durationMs);
      const b0 = q2('rm-zcopy-before'), a0 = q2('rm-zcopy-after'), t0 = attr('rm-tethers', 'd'), m0 = attr('rm-sclock-min', 'transform');
      x.seek(x.durationMs);
      const b1 = q2('rm-zcopy-before'), a1 = q2('rm-zcopy-after'), t1 = attr('rm-tethers', 'd'), m1 = attr('rm-sclock-min', 'transform');
      const row = svg.querySelector('[data-node="marker-row"]');
      out.push({name: pr.name, b0, a0, b1, a1, connector: t0 !== t1, hands: m0 !== m1, marker: row ? row.textContent.replace(/\s+/g, '') : null});
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  for (const r0 of rendered) {
    const q = {...def.defaultParams, ...presets.find(p => p.name === r0.name).params};
    if (!r0.connector) bad.push(`${r0.name}: the connector does not follow the minute hand`);
    if (!r0.hands) bad.push(`${r0.name}: the session clock's hands do not follow the time`);
    if (!(r0.b0 > 0.95 && r0.a0 < 0.05)) bad.push(`${r0.name}: before, the card's dial is not on the supplied time (${r0.b0}/${r0.a0})`);
    if (!(r0.a1 > 0.95 && r0.b1 < 0.05)) bad.push(`${r0.name}: after, the card's dial is not on the alternative time (${r0.b1}/${r0.a1})`);
    if (r0.marker !== q.contextLabels.marker.replace(/\s+/g, '')) bad.push(`${r0.name}: rendered marker "${r0.marker}"`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// Lens magnification at SIZED hosts (coordinator decision 2026-10-04, LAW-0300: >= 1.5x on the text at every host size):
// the datum text in the lens ÷ the same text in the context at rest, in a 640×360 element and at 800×600 and 1400×1000
// viewports (every preset × ratio).
test(`${ID}: lens text magnification >= 1.5 at sized hosts (640×360 element, 800×600 and 1400×1000 viewports)`, async ({browser}) => {
  test.setTimeout(600000);
  const bad = [];
  const stats = {};
  for (const [vw, vh, el] of [[1280, 800, [640, 360]], [800, 600, null], [1400, 1000, null]]) {
    const page = await browser.newPage({viewport: {width: vw, height: vh}});
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const res = await page.evaluate(async ([id, presets, el]) => {
      const def = await window.__lib.load(id);
      const out = [], st = [];
      for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
        const d = document.createElement('div');
        if (el) d.style.cssText = `width:${el[0]}px;height:${el[1]}px`;
        document.getElementById('slots').appendChild(d);
        const x = def.create(d, {width: w, height: h, params: pr.params});
        await x.ready;
        if (el) { x.element.style.width = el[0] + 'px'; x.element.style.height = el[1] + 'px'; }
        const svg = x.element;
        const sz = n => { const t = svg.querySelector('[data-node="' + n + '"] text'); if (!t) return null; const m = t.getScreenCTM(); return parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b); };
        x.seek(0.1 * x.durationMs); const rest = sz('rm-cap-v-before-text');
        x.seek(0.4 * x.durationMs); const lens = sz('lz-cap-v-before-text');
        if (rest && lens) { const m = lens / rest; st.push(m); if (m < 1.5) out.push(`${pr.name} ${w}x${h}${el ? ' el' + el.join('x') : ''}: ×${m.toFixed(3)}`); }
        x.destroy(); d.remove();
      }
      return {out, min: Math.min(...st)};
    }, [ID, presets, el]);
    bad.push(...res.out);
    stats[`${vw}x${vh}${el ? ' el' : ''}`] = Math.round(res.min * 1000) / 1000;
    await page.close();
  }
  console.log(`[hearings-08] ${ID} sized-host lens magnification (min): ${JSON.stringify(stats)}`);
  expect(bad, bad.join('\n')).toEqual([]);
});
glyphFollowsStateTest(ID);
