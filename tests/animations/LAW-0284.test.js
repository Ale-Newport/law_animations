// LAW-0284 — Apertura de audiencia · inspect. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second, enlarged copy of the same
// room coordinates around the wall control unit), the change is localised (one datum, the session state; only its
// dependent state follows: frame, switch lever, lamps), and seeking back restores exactly the previous datum.
// Lens rules (AUTHORING line 109), measured on the RENDERED DOM: the lens's smaller side >= 0.37 of the frame's short
// side (the band is 0.35-0.45; 16:9 and 9:16 reach 0.43-0.60, 1:1 0.37-0.38 because the context keeps >= 0.46 of the
// width beside it); magnification >= 1.5x against the context AT REST (u 0.1); the context stays wholly visible (the lens
// never overlaps it) and keeps >= 0.45 of the frame width (16:9, 1:1) or, portrait stacked (coordinator decision
// 2026-09-27, LAW-0232, production/SESSION_HANDOFF.md), >= 0.45 in either dimension with context + lens spanning
// >= 0.8 and context people >= 45 px; one copy of the datum at a time (never both >= 0.15) with the lens copy arriving
// within 200 ms of the context copy leaving; nothing the rim would cut is drawn (every piece wholly in or out, nobody in
// the crop); the panel and the lens are never shown together; sequenced return.
// Windows (u): src frame 0.18–0.205 · panel out 0.185–0.205 · context copy out 0.205–0.209 · context steps back 0.209–0.235 ·
// lens opens 0.212–0.24, starting later (up to ~0.226) when the stepping-back context has not yet cleared the window, with the context copy hand-over shifted by the same amount (its enlarged copy fades in from 40 % open) · strike 0.46–0.50 · dock 0.51–0.55 · new value
// 0.555–0.585 · frame 0.56–0.59 · switch 0.60–0.65 · lamps 0.64–0.70 · lens closes 0.728–0.744 (its copy fades out below
// 70 % open) · context forward 0.744–0.758 · context copy back 0.758–0.761 · panel back 0.765–0.79 · Δ 0.80–0.83; still
// from u 0.83.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, limbsClearTest,
  chipsOwnTest, equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';

const ID = 'LAW-0284';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.started === 1 && s.switchK === 1 && s.lights === 1 && s.ctxCopy === 1", label: 'build: the context at full size, the supplied before value on the display, switch at ●, lamps on; no lens'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoomVsRest >= 1.5 && s.ctxCopy === 0 && s.lensCopy === 1 && !s.bothCopies && s.panel === 0', label: 'isolate: a real enlargement (>= 1.5x the context at rest) holds the datum; the context copy is hidden; the panel is out'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.docked === 0 && s.started === 1", label: 'substitute: the old value is struck through before anything else changes'},
    {at: 0.6, fn: "s.datum === 'after' && s.docked === 1 && s.newShown === 1 && s.started === 0 && s.switchK === 1", label: 'the new value comes (and its pending frame), before the switch moves'},
    {at: 0.7, fn: 's.switchK === 0 && s.lights === 0 && s.lensOpen === 1', label: 'then only the dependent state follows: switch lever at ◆, lamps off'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.docked === 1 && s.panel === 1 && s.problems.length === 0", label: 'hold: new value, struck old value docked, marker shown; the composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.docked === 0 && s.started === 1 && s.switchK === 1", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.before === 'pending' && s.started === 1 && s.switchK === 1 && s.lights === 1", label: 'another supplied pair: pending → started (solid frame, switch at ●, lamps on); nothing else is inferred'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: 's.switchK === 0 && s.lensOpen === 1', label: 'labels hidden: the same localised change is visible'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.speaker < p.speakers.length).map(s => s.text), ...p.exhibits, p.afterValue, p.beforeValue, p.labels.sequence, p.labels.key, p.contextLabels.context, p.contextLabels.marker, p.actorLabels.participant, p.objectLabels.lights, p.objectLabels.card, p.objectLabels.clock];',
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.speaker < p.speakers.length).map(s => s.text), ...p.exhibits, p.afterValue];',
  captions: 'return [p.labels.sequence, p.contextLabels.context, p.actorLabels.participant, p.objectLabels.lights, p.objectLabels.card, p.objectLabels.clock];',
});

ratioChecks(ID, 'lens sequencing: one copy at a time, panel never with the lens, new value still, sequenced return', [
  {at: times(0.2, 0.3, 0.0025), fn: '!s.bothCopies', label: 'open: the two copies of the datum are never both shown'},
  {at: times(0.7, 0.8, 0.0025), fn: '!s.bothCopies', label: 'close: the two copies of the datum are never both shown'},
  {at: times(0.2, 0.82, 0.005), fn: 's.panel < 0.02 || s.lensOpen < 0.01', label: 'the text panel and the lens are never shown together'},
  {at: [0.59, 0.62, 0.65, 0.68, 0.71], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [0.3, 0.45, 0.6, 0.7], fn: 's.zoomVsRest >= 1.5 && s.lensMinSide >= 0.37', label: 'the lens magnifies >= 1.5x (model) and its smaller side >= 0.37 of the frame short side (model)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// ---------------------------------------------------------------------------------------------
// Rendered lens checks (every preset × ratio × labels shown and hidden).
test(`${ID}: rendered lens: smaller side, magnification vs rest, context kept, span, crop pieces whole, copies sequenced`, async ({page}) => {
  test.setTimeout(900000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const F = svg.getBoundingClientRect();
    const s0 = svg.getScreenCTM().a;
    // frame in screen px (the svg keeps its aspect: viewBox × CTM)
    const fw = w * s0, fh = h * s0, fx = svg.getScreenCTM().e, fy = svg.getScreenCTM().f;
    const scaleOf = e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); };
    x.seek(0.1 * x.durationMs);
    const restDisp = box(node(svg, 'rm-display')).w;
    const t0 = node(svg, 'rm-d-' + (x.getState({bounds: false}).semantic.before) + '-text');
    const restText = t0 ? parseFloat(getComputedStyle(t0).fontSize) * scaleOf(t0) : null;
    for (const u of [0.32, 0.4, 0.5, 0.6, 0.7]) {
      x.seek(u * x.durationMs);
      const L = box(node(svg, 'lens-bg'));
      const side = Math.min(L.w, L.h) / Math.min(fw, fh);
      stat('lens side / short side ' + ratio, Math.round(side * 1000) / 1000);
      if (side < 0.37) out.push(tag + ' u=' + u + ': lens smaller side ' + side.toFixed(3) + ' of the short side');
      const mag = box(node(svg, 'lz-display')).w / restDisp;
      stat('magnification vs rest ' + ratio, Math.round(mag * 100) / 100);
      if (mag < 1.5) out.push(tag + ' u=' + u + ': lens display ÷ display at rest = ' + mag.toFixed(2));
      const sem = x.getState({bounds: false}).semantic;
      const lt = node(svg, 'lz-d-' + sem.before + '-text');
      if (restText && lt && u < 0.5) { const tm = parseFloat(getComputedStyle(lt).fontSize) * scaleOf(lt) / restText; if (tm < 1.5) out.push(tag + ' u=' + u + ': datum text ×' + tm.toFixed(2)); }
      // the context room stays wholly visible (the lens never overlaps it) and keeps its share
      const C = box(node(svg, 'rm-walls'));
      if (hit(C, L, 1)) out.push(tag + ' u=' + u + ': the lens overlaps the context room');
      const cw = C.w / fw, ch = C.h / fh;
      stat('context width share ' + ratio, Math.round(cw * 1000) / 1000);
      const portrait = h > w * 1.2;
      if (portrait) {
        // coordinator decision 2026-09-27 (LAW-0232): stacked lens in portrait — the context keeps >= 0.45 in either
        // dimension and context + lens span >= 0.8 (measured, as in LAW-0232's test, across the frame width)
        const span = (Math.max(C.r, L.r) - Math.min(C.l, L.l)) / fw;
        const spanH = (Math.max(C.b, L.b) - Math.min(C.t, L.t)) / fh;
        stat('portrait context+lens span (width) ' + ratio, Math.round(span * 1000) / 1000);
        stat('portrait context+lens span (height, the safe box is 0.74) ' + ratio, Math.round(spanH * 1000) / 1000);
        if (Math.max(cw, ch) < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(2) + ' × ' + ch.toFixed(2) + ' of the frame');
        if (span < 0.8) out.push(tag + ' u=' + u + ': context + lens span ' + span.toFixed(2) + ' of the width');
      } else if (cw < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(3) + ' of the frame width');
      // every piece drawn in the lens lies wholly inside its window (nothing cut by the rim) — walls and floor excepted
      for (const e of svg.querySelectorAll('[data-node^="lz-"]')) {
        const nm = e.getAttribute('data-node');
        if (!/^lz-(p\\d|chair\\d|card\\d|table|tray|sheet\\d|cabinet|exhibit\\d|clock|lamp\\d|unit|display|switch)$/.test(nm)) continue;
        const b = box(e);
        if (b.w < 1) continue;
        if (b.l < L.l - 1 || b.r > L.r + 1 || b.t < L.t - 1 || b.b > L.b + 1) out.push(tag + ' u=' + u + ': ' + nm + ' is cut by the lens rim');
      }
      if (nodes(svg, /^lz-p\\d$/).length) out.push(tag + ': a person is drawn in the lens');
    }
    // one copy at a time at 60 fps over the open and the close; the lens copy arrives within 200 ms of the context copy leaving
    const copies = pre => [...svg.querySelectorAll('[data-node^="' + pre + '-d-"]')].filter(e => /-d-(started|pending)$/.test(e.getAttribute('data-node')) && e.querySelector('text'));
    let gapRun = 0, worstGap = 0, both = 0;
    for (let ms = 0.2 * x.durationMs; ms <= 0.82 * x.durationMs; ms += 1000 / 60) {
      x.seek(ms);
      const c = Math.max(0, ...copies('rm').map(e => eff(svg, e)));
      const l = Math.max(0, ...copies('lz').map(e => eff(svg, e)));
      if (c >= 0.15 && l >= 0.15) both++;
      gapRun = c < 0.15 && l < 0.15 ? gapRun + 1000 / 60 : 0;
      worstGap = Math.max(worstGap, gapRun);
      const lensOp = eff(svg, node(svg, 'lens')), panelOp = eff(svg, node(svg, 'panel'));
      if (lensOp > 0.02 && panelOp > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: panel and lens shown together');
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

// Through the return and the hold the new value, the struck old value (docked, "was") and the Δ stay visible.
ratioChecks(ID, 'value traceable at the hold', [
  {at: times(0.87, 1, 0.01), tv: ['all'], dom: "(() => { const e = n => svg.querySelector('[data-node=\"' + n + '\"]'); const op = el => { let o = 1; for (let q = el; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; }; return op(e('rm-dock')) > 0.95 && op(e('rm-was')) > 0.95 && op(e('cx-marker')) > 0.95; })()", label: 'rendered: at the hold the docked old value, its "was" and the Δ marker are fully visible'},
]);

const CHIPS = ['[data-node^="lab"][data-node$="-body"]', '[data-node^="exchip"][data-node$="-body"]'];
const PROPS = ['[data-node^="rm-sheet"]', '[data-node^="rm-card"]', '[data-node^="rm-exhibit"]', '[data-node="rm-tray"]', '[data-node="rm-display"]', '[data-node="rm-switch"]', '[data-node="rm-clock"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: [...CHIPS, '[data-node="lens-bg"]']});
noOverlapTest(ID, {markers: [...CHIPS, '[data-node="cx-marker"]', '[data-node="src-frame"]', '[data-node="rm-dock"]'], opaque: ['[data-node="lens"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {lens: [0.21, 0.8]});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="lens-bg"]', '[data-node="cx-marker"]', '[data-node="rm-dock"]']});
limbsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.1, 1], maxGap: 60});
equalWeightTest(ID, {marks: [['[data-node="rm-d-pending"] path:not([data-node$="-slip"])', '[data-node="rm-d-started"] circle'], ['[data-node="lz-d-pending"] path:not([data-node$="-slip"])', '[data-node="lz-d-started"] circle']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.3, 0.5, 0.62, 0.76, 0.9, 1]});
fillMostTest(ID, {subject: '[data-node="rm-room"]'});
thinContentTest(ID);
esDefaultsTest(ID);

// The lens window (shadow and rim included) never covers a seated person's head at any opacity above 0, while it grows,
// holds or shrinks: every frame at 60 fps, every preset × ratio × labels shown/hidden (precedent LAW-0256).
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
      // the window itself: shadow, background and rim (the clipped enlarged copy inside does not extend it)
      const Ls = ['lens-shadow', 'lens-bg', 'lens-rim'].map(n => box(node(svg, n)));
      const L = {l: Math.min(...Ls.map(q => q.l)), t: Math.min(...Ls.map(q => q.t)), r: Math.max(...Ls.map(q => q.r)), b: Math.max(...Ls.map(q => q.b))};
      for (const hd of nodes(svg, /^rm-p\\d-head$/)) {
        if (eff(svg, hd) <= 0) continue;
        const c = headCircle(hd);
        if (discHits(c, L, 0)) out.push(pr.name + ' ' + ratio + ' u=' + (ms / x.durationMs).toFixed(4) + ': lens (opacity ' + eff(svg, lens).toFixed(2) + ') over ' + hd.getAttribute('data-node'));
      }
    }
    stat('lens frames checked ' + ratio, frames, 'max');
    return out;`, {}, {withHidden: true});
  report(ID, 'lens over heads', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The room's session-state text is fully shown at rest (u 0 until the lens opens): the context copy's floor fade only
// acts while the context steps back. Every preset (plus locale 'es' alone) × ratio, labels shown.
test(`${ID}: the room's session-state text is fully opaque at rest, before the lens opens (every preset × ratio, es-only too)`, async ({page}) => {
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
        const op = Math.max(...['rm-d-started-text', 'rm-d-pending-text'].map(n => { const e = svg.querySelector(`[data-node="${n}"]`); return e ? eff(e) : 0; }));
        worst = Math.min(worst, op);
        if (op < 0.999) out.push(`${pr.name} ${ratio} u=${u}: session-state text opacity ${op.toFixed(3)}`);
      }
      x.destroy(); el.remove();
    }
    return {bad: out, worst};
  }, [ID, presets]);
  console.log(`[hearings-01] ${ID} rest session-state text: min opacity ${worst}`);
  expect(bad, bad.join('\n')).toEqual([]);
});
