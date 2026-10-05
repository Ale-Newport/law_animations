// LAW-0320 — Lectura de resolución · inspect. Contract battery + the full lens checklist (AUTHORING line 109) rendered
// (copied from the hearings-09 inspect test, LAW-0316, and adapted; that file stays unchanged).
// acceptanceCheck (brief): the detail keeps its source coordinates (a real enlarged copy of the same room), the change is
// localised (one supplied datum: which paragraphs section A holds; only its dependent geometry follows: the one line of
// A whose paragraph changed slides to the new paragraph), and seeking back restores the old datum exactly.
// Timing (u): build 0–0.20 · frame 0.18–0.205, panel out, context copy (text and ● mark) out with the lens copy in,
// context steps back, lens opens (labels shown: tight on the plate and its dock, the dock holding a record of the old
// value from the opening) · in the hidden context the old value moves, unchanged (no strike), to its dock 0.48–0.55; in
// the lens the record is captioned "was" 0.54–0.555 and the plate's value changes in place 0.555–0.585 (labels hidden:
// the changed paragraph's mark slides 0.50–0.585) · the changed line slides 0.60–0.68 · close 0.728–0.744, forward,
// context copy in · panel in 0.744–0.762 · marker 0.80–0.83.
// Legal (VERY HIGH risk): placeholder text only; a line only means "placed in this section (as supplied)"; neither value
// is marked as wrong (no strike, no red, no warning); section B, its plate and its lines never move; jurisdiction
// unspecified. Lens (coordinator): magnification >= 1.5x on the text at every host (sized hosts too; target 1.6x); the
// smaller side >= 0.35 of the short side (0.36 measured, margin); the visible context >= 0.45; nothing cut by the rim;
// the panel and the lens never together and never both nearly invisible for more than 150 ms (60 fps); one copy of the
// datum at a time (text and mark), hand-over <= 180 ms. People floors (coordinator; hearings measure the FIGURE height):
// >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45 px); context people >= 45 px while the lens is open.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, lrConsistencyTest, glyphSideTest, noTwinTextTest, placesKeptTest, linksAnchoredTest, gluedNumbersTest, noOneWordLineTest, ES_WORDS, FLOOR_FOR} from './lectura-resolucion-checks.js';

const ID = 'LAW-0320';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.linkState === 'before'", label: 'build: the context at full size (both sections linked), the supplied before value on A\'s plate; no lens'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoomVsRest >= 1.5 && s.ctxCopy === 0 && s.lensCopy === 1 && !s.bothCopies && s.panel === 0', label: 'isolate: a real enlargement (>= 1.5x the context at rest) holds the datum; the context copy is hidden; the panel is out'},
    {at: 0.5, fn: "s.datum === 'changing' && s.strike === 0 && s.docked > 0 && s.linkState === 'before'", label: 'substitute: the old value moves, unchanged and never struck, to its dock before anything else changes'},
    {at: 0.59, fn: "s.datum === 'after' && s.docked === 1 && s.newShown === 1 && s.linkState === 'before' && s.strike === 0", label: 'the new value comes before its dependent geometry changes'},
    {at: 0.7, fn: "s.linkState === 'after' && s.lensOpen === 1", label: 'then only the dependent geometry follows: the changed line slides to the newly placed paragraph'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.docked === 1 && s.panel === 1 && s.strike === 0 && s.problems.length === 0", label: 'hold: new value, the old value docked (traceable, not struck), marker; the composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.docked === 0 && s.linkState === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.linksBefore.join() === '2,3' && s.linksAfter.join() === '1,3' && s.linkState === 'after'", label: 'another supplied pair: paragraphs 3 and 4 become 2 and 4; nothing else is inferred'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.linkState === 'after' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.afterValue, p.beforeValue, p.referencesB, p.states.a, p.states.b, p.labels.sequence, p.labels.key, p.contextLabels.context, p.contextLabels.marker];",
  content: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.afterValue, p.referencesB];",
  captions: 'return [p.labels.sequence, p.contextLabels.context];',
});

ratioChecks(ID, 'lens sequencing: one copy at a time, panel never with the lens, new value still, sequenced return, B never moves', [
  {at: times(0.2, 0.3, 0.0025), fn: '!s.bothCopies', label: 'open: the two copies of the datum are never both shown'},
  {at: times(0.7, 0.8, 0.0025), fn: '!s.bothCopies', label: 'close: the two copies of the datum are never both shown'},
  {at: times(0.2, 0.82, 0.005), fn: 's.panel < 0.02 || s.lensOpen < 0.01', label: 'the text panel and the lens are never shown together'},
  {at: [0.59, 0.62, 0.65, 0.68, 0.71], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [0.3, 0.45, 0.6, 0.7], fn: 's.zoomVsRest >= 1.5 && s.lensMinSide >= 0.36', label: 'the lens magnifies >= 1.5x (model) and its smaller side >= 0.36 of the frame short side (model)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// Rendered lens checklist (every preset × ratio × labels shown and hidden): smaller side >= 0.36 of the short side
// (coordinator floor 0.35, with margin);
// magnification >= 1.5 against the context at REST measured on the card and on the datum TEXT; the context stays a
// real, visible scene (never overlapped, >= 0.45 share); nothing the rim would cut is drawn; no person in the lens;
// one copy of the datum at a time (its text AND its plate's ● mark), the lens copy legible within 180 ms of the context
// copy leaving (open and close);
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
    const card = node(svg, 'rm-refs-a');
    if (!card) { out.push(tag + ': no reference plate'); return out; }
    const restCard = box(node(svg, 'rm-refs-a-body')).w;
    const t0 = node(svg, 'rm-refs-a-v-before-text'); void sem0;
    const restText = t0 ? parseFloat(getComputedStyle(t0).fontSize) * scaleOf(t0) : null;
    for (const u of [0.32, 0.4, 0.5, 0.6, 0.7]) {
      x.seek(u * x.durationMs);
      const L = box(node(svg, 'lens-bg'));
      const side = Math.min(L.w, L.h) / Math.min(fw, fh);
      stat('lens side / short side ' + ratio, Math.round(side * 1000) / 1000);
      if (side < 0.36) out.push(tag + ' u=' + u + ': lens smaller side ' + side.toFixed(3) + ' of the short side');
      const lzc = node(svg, 'lz-refs-a-body');
      const mag = lzc ? box(lzc).w / restCard : 0;
      stat('magnification vs rest (card) ' + ratio, Math.round(mag * 100) / 100);
      // (coordinator: >= 1.5x on the text at every host; 1.6x is the robustness target)
      const minMag = 1.5;
      if (mag < minMag) out.push(tag + ' u=' + u + ': lens card ÷ card at rest = ' + mag.toFixed(2));
      const sem = x.getState({bounds: false}).semantic;
      const lt = node(svg, 'lz-refs-a-v-before-text'); void sem;
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
        if (!/^lz-(p\\d|chair\\d|refs-a|refs-b|dock|was|card-a|card-b|evidence|exhibit\\d|clock|lectern)$/.test(nm)) continue;
        if (eff(svg, e) < 0.05) continue;
        const b = box(e);
        if (b.w < 1) continue;
        if (b.l < L.l - 1 || b.r > L.r + 1 || b.t < L.t - 1 || b.b > L.b + 1) out.push(tag + ' u=' + u + ': ' + nm + ' is cut by the lens rim');
      }
      if (nodes(svg, /^lz-p\\d$/).length) out.push(tag + ': a person is drawn in the lens');
    }
    // one copy at a time at 60 fps; the lens copy arrives within 200 ms of the context copy leaving (open and close)
    const copies = pre => [...svg.querySelectorAll('[data-node^="' + pre + '-refs-a-v-"]')].filter(e => /-v-(before|after)$/.test(e.getAttribute('data-node')) && e.querySelector('text'));
    let gapRun = 0, worstGap = 0, both = 0;
    for (let ms = 0.2 * x.durationMs; ms <= 0.82 * x.durationMs; ms += 1000 / 60) {
      x.seek(ms);
      const c = Math.max(0, ...copies('rm').map(e => eff(svg, e)));
      const l = Math.max(0, ...copies('lz').map(e => eff(svg, e)));
      if (c >= 0.15 && l >= 0.15) both++;
      const mc = node(svg, 'rm-refs-a-mark'), ml = node(svg, 'lz-refs-a-mark');
      if (mc && ml && eff(svg, mc) >= 0.15 && eff(svg, ml) >= 0.15 && eff(svg, node(svg, 'lens')) > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: the ● mark of the plate is shown in the context and in the lens');
      gapRun = c < 0.15 && l < 0.15 ? gapRun + 1000 / 60 : 0;
      worstGap = Math.max(worstGap, gapRun);
      if (eff(svg, node(svg, 'lens')) > 0.02 && eff(svg, node(svg, 'panel')) > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: panel and lens shown together');
    }
    if (copies('rm').length) {
      stat('worst copy hand-over gap ms ' + ratio, Math.round(worstGap), 'max');
      if (both) out.push(tag + ': both copies >= 0.15 in ' + both + ' frames');
      if (worstGap > 180) out.push(tag + ': no copy of the datum legible for ' + Math.round(worstGap) + ' ms');
    }
    return out;`, {}, {withHidden: true});
  report(ID, 'lens', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Lens fill (coordinator decision 2026-10-05, LENS FILL METRIC; hearings-10 fix round), rendered at every preset × ratio
// through the whole open phase (lens opacity >= 0.95 at its full size, 1/200 of the timeline): the drawn lens content —
// the plate, the dock tray (and section A's card when the crop holds it) — covers >= 0.40 of the window, and the legible
// texts in the lens (opacity >= 0.3) >= 0.30 of it, labels shown. The dock tray is in the lens from the opening, EMPTY
// until the substitution (coordinator ruling, round 2: one legible copy of the old value at a time); the record of the
// old value enters it at the substitution, as the plate takes the new value; the old value is never legible on the plate
// and in the dock at once, and the record is never shown while the context's copy of the datum is legible.
// DOCUMENTED 1:1 LIMIT (coordinator ruling, LENS TEXT COVERAGE 1:1 LIMIT, 2026-10-05): at 1:1 the lens is held to about
// half the frame width (context >= 0.46) and must keep a smaller side >= 0.36, so the window grows taller than the
// plate and its empty dock; with the panel text >= 19.5 px and the 1:1 people floor, the plate text cannot grow further.
// Measured minima before the substitution: baseline-es / es-only 1:1 0.209–0.212, long-labels-stress 1:1 0.227. For those
// cases (1:1 × baseline-es, es-only, long-labels-stress) the text gate is >= 0.20, asserted together with content fill
// >= 0.40, the empty dock tray drawn, and no twin text in the lens; every other preset × ratio keeps >= 0.30.
test(`${ID}: rendered lens fill — content >= 0.40 and text >= 0.30 of the window through the whole open phase (labels shown)`, async ({page}) => {
  test.setTimeout(900000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const lens = node(svg, 'lens');
    const clipA = (B, L) => Math.max(0, Math.min(B.r, L.r) - Math.max(B.l, L.l)) * Math.max(0, Math.min(B.b, L.b) - Math.max(B.t, L.t));
    let mxW = 0;
    for (let u = 0.2; u <= 0.76; u += 0.005) { x.seek(u * x.durationMs); if (eff(svg, lens) >= 0.95) mxW = Math.max(mxW, box(node(svg, 'lens-bg')).w); }
    let n = 0, minF = 9, minT = 9;
    for (let u = 0.2; u <= 0.76; u += 0.005) {
      x.seek(u * x.durationMs);
      if (eff(svg, lens) < 0.95) continue;
      const L = box(node(svg, 'lens-bg'));
      if (L.w < 0.99 * mxW) continue;
      n++;
      const A = L.w * L.h;
      let ta = 0;
      for (const t of lens.querySelectorAll('text')) if (eff(svg, t) >= 0.3) ta += clipA(box(t), L);
      let ca = 0;
      for (const e of [node(svg, 'lz-refs-a-body'), node(svg, 'lz-card-a-body'), node(svg, 'lz-dock') && node(svg, 'lz-dock').querySelector('path')]) if (e && eff(svg, e) >= 0.3) ca += clipA(box(e), L);
      minF = Math.min(minF, ca / A); minT = Math.min(minT, ta / A);
      if (ca / A < 0.4) out.push(tag + ' u=' + u.toFixed(3) + ': lens content fill ' + (ca / A).toFixed(3));
      const limit = ratio === '1:1' && ['baseline-es', 'es-only', 'long-labels-stress'].includes(pr.name);
      if (ta / A < (limit ? 0.2 : 0.3)) out.push(tag + ' u=' + u.toFixed(3) + ': lens text coverage ' + (ta / A).toFixed(3));
      if (limit) {
        // (the documented limit holds only with a full lens, its empty dock tray drawn, and one copy of each text)
        const tray = node(svg, 'lz-dock') && node(svg, 'lz-dock').querySelector('path');
        if (!tray || eff(svg, tray) < 0.95) out.push(tag + ' u=' + u.toFixed(3) + ': 1:1 limit without the dock tray drawn');
        const seen = new Map();
        for (const t of lens.querySelectorAll('text')) { if (eff(svg, t) < 0.15) continue; const k2 = t.textContent.replace(/\\s+/g, ' ').trim(); if (k2.length >= 3) seen.set(k2, (seen.get(k2) || 0) + 1); }
        for (const [k2, c2] of seen) if (c2 > 1) out.push(tag + ' u=' + u.toFixed(3) + ': twin text in the lens "' + k2.slice(0, 30) + '"');
      }
      const dv = node(svg, 'lz-dock-v'), ob = node(svg, 'lz-refs-a-v-before');
      if (!dv) out.push(tag + ': no dock record node');
      else {
        const sem = x.getState({bounds: false}).semantic;
        if (u < 0.55 && eff(svg, dv) > 0.01) out.push(tag + ' u=' + u.toFixed(3) + ': the dock shows the old value before the substitution');
        if (u > 0.6 && eff(svg, dv) < 0.95) out.push(tag + ' u=' + u.toFixed(3) + ': the dock record is not shown after the substitution');
        if (eff(svg, dv) >= 0.15 && ob && eff(svg, ob) >= 0.15) out.push(tag + ' u=' + u.toFixed(3) + ': the old value is legible on the plate and in the dock at once');
        void sem;
      }
      const dk = node(svg, 'lz-dock');
      if (!dk || eff(svg, dk) < 0.95) out.push(tag + ' u=' + u.toFixed(3) + ': the dock tray is not in the lens');
    }
    // (the record in the lens's dock is never legible together with the context's copy of the datum)
    for (let ms = 0.15 * x.durationMs; ms <= 0.85 * x.durationMs; ms += 1000 / 60) {
      x.seek(ms);
      const dv = node(svg, 'lz-dock-v');
      const cc = Math.max(0, ...['rm-refs-a-v-before', 'rm-refs-a-v-after'].map(q => (node(svg, q) ? eff(svg, node(svg, q)) : 0)));
      if (dv && eff(svg, dv) * Math.min(1, eff(svg, lens)) >= 0.15 && cc >= 0.15) out.push(tag + ' ' + Math.round(ms) + ' ms: the dock record and the context copy are both legible');
    }
    if (n < 60) out.push(tag + ': only ' + n + ' open frames sampled');
    stat('min content fill ' + ratio, Math.round(minF * 1000) / 1000);
    stat('min text coverage ' + ratio, Math.round(minT * 1000) / 1000);
    return out;`, {}, {withHidden: false});
  report(ID, 'lens fill', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden (hearings-10 fix round): the lens still shows the change without any text — on section A's plate the
// mark of the changed paragraph slides from the old paragraph's sheet to the new one's, inside the open lens (as the
// cf-08 LAW-0472 lens does with its marks); the unchanged marks stay put; the context's copy of the marks is hidden while
// the lens holds them and shows the new state right after the close.
test(`${ID}: labels hidden — a non-text mark moves inside the open lens (the changed paragraph's mark), every preset × ratio`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    if (!/labels hidden/.test(pr.name)) return out;
    const tag = pr.name + ' ' + ratio;
    const lens = node(svg, 'lens');
    const marks = pre => nodes(svg, new RegExp('^' + pre + '-rmk-a\\\\d$'));
    const at = u => { x.seek(u * x.durationMs); return marks('lz').map(e => { const b = box(e); return {x: (b.l + b.r) / 2, y: (b.t + b.b) / 2, op: eff(svg, e)}; }); };
    const k = svg.getScreenCTM().a;
    const s = x.getState({bounds: false}).semantic;
    const a = at(0.45), b = at(0.66);
    if (!a.length) { out.push(tag + ': no marks on the plate in the lens'); return out; }
    x.seek(0.45 * x.durationMs); const op0 = eff(svg, lens);
    x.seek(0.66 * x.durationMs); const op1 = eff(svg, lens);
    if (op0 < 0.95 || op1 < 0.95) out.push(tag + ': the lens is not open at u 0.45 / 0.66');
    const moved = a.map((p, j) => Math.hypot(b[j].x - p.x, b[j].y - p.y) / k);
    const changed = s.changed;
    let maxMove = 0;
    moved.forEach((m, j) => {
      if (changed[j]) { maxMove = Math.max(maxMove, m); if (m < 20) out.push(tag + ': the changed mark ' + j + ' moves only ' + m.toFixed(1) + ' px in the lens'); }
      else if (m > 0.5) out.push(tag + ': an unchanged mark ' + j + ' moved ' + m.toFixed(1) + ' px');
      if (a[j].op < 0.95 || b[j].op < 0.95) out.push(tag + ': mark ' + j + ' not fully shown in the open lens');
    });
    stat('changed mark travel px ' + ratio, Math.round(maxMove * 10) / 10);
    // the context's marks: hidden while the lens holds them; the new state right after the close
    for (const u of [0.4, 0.6]) { x.seek(u * x.durationMs); if (marks('rm').some(e => eff(svg, e) >= 0.15)) out.push(tag + ' u=' + u + ': the context shows its copy of the marks while the lens is open'); }
    x.seek(0.765 * x.durationMs);
    const s1 = x.getState({bounds: false}).semantic;
    const cm = marks('rm');
    if (cm.some(e => eff(svg, e) < 0.95)) out.push(tag + ': the context marks are not back right after the close');
    x.seek(x.durationMs);
    const fin = cm.map(e => { const bb = box(e); return (bb.l + bb.r) / 2; });
    x.seek(0.765 * x.durationMs);
    cm.forEach((e, j) => { const bb = box(e); if (Math.abs((bb.l + bb.r) / 2 - fin[j]) > 0.5) out.push(tag + ': context mark ' + j + ' not in its new place right after the close'); });
    void s1;
    return out;`, {}, {withHidden: true});
  report(ID, 'labels hidden: mark change', stats);
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
        const ts = [...svg.querySelectorAll('[data-node="rm-card-a-text"], [data-node="rm-card-b-text"], [data-node="rm-refs-b-text"], [data-node="rm-refs-a-v-before-text"]')];
        for (const t of ts) { const op = eff(t); worst = Math.min(worst, op); if (op < 0.999) out.push(`${pr.name} ${ratio} u=${u}: ${t.getAttribute('data-node')} opacity ${op.toFixed(3)}`); }
      }
      x.destroy(); el.remove();
    }
    return {bad: [...new Set(out)].slice(0, 20), worst};
  }, [ID, presets]);
  console.log(`[hearings-10] ${ID} rest context text: min opacity ${worst}`);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Through the hold the new value, the docked struck old value ("was") and the Δ stay fully visible.
ratioChecks(ID, 'value traceable at the hold', [
  {at: times(0.87, 1, 0.01), tv: ['all'], dom: "(() => { const e = n => svg.querySelector('[data-node=\"' + n + '\"]'); if (!e('rm-dock')) return false; const op = el => { let o = 1; for (let q = el; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; }; return op(e('rm-dock')) > 0.95 && op(e('rm-was')) > 0.95 && op(e('rm-dock-v')) > 0.95 && op(e('cx-marker')) > 0.95; })()", label: 'rendered: at the hold the docked old value, its "was" and the Δ marker are fully visible'},
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


// Only the dependent geometry follows the datum: across the whole timeline (60 fps) section B's line tips and every
// line of A whose exhibit did not change stay exactly where they are; the changed line ends, at the hold, on the newly
// placed paragraph (rendered), and seeking back puts it on the old one.
test(`${ID}: only the changed line of A moves; B and the unchanged lines never move; the changed line lands on the new exhibit`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(0.1 * x.durationMs);
    const s0 = x.getState({bounds: false}).semantic;
    let worstB = 0, worstA = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      s.tipsB.forEach((p, j) => { if (p && s0.tipsB[j]) worstB = Math.max(worstB, Math.hypot(p.x - s0.tipsB[j].x, p.y - s0.tipsB[j].y)); });
      s.tipsA.forEach((p, j) => { if (!s.changed[j] && p && s0.tipsA[j]) worstA = Math.max(worstA, Math.hypot(p.x - s0.tipsA[j].x, p.y - s0.tipsA[j].y)); });
    }
    stat('worst B tip drift ' + ratio, Math.round(worstB * 100) / 100, 'max');
    if (worstB > 0.01) out.push(tag + ': a line of B moved ' + worstB.toFixed(2));
    if (worstA > 0.01) out.push(tag + ': an unchanged line of A moved ' + worstA.toFixed(2));
    x.seek(x.durationMs);
    const s1 = x.getState({bounds: false}).semantic;
    s1.changed.forEach((c, j) => {
      if (!c) return;
      const ln = node(svg, 'rm-link-a' + j);
      if (ln.getAttribute('data-ex') !== String(s1.linksAfter[j])) out.push(tag + ': changed line ' + j + ' lands on ' + ln.getAttribute('data-ex') + ', not ' + s1.linksAfter[j]);
    });
    x.seek(0.3 * x.durationMs);
    const s2 = x.getState({bounds: false}).semantic;
    s2.changed.forEach((c, j) => { if (c && node(svg, 'rm-link-a' + j).getAttribute('data-ex') !== String(s2.linksBefore[j])) out.push(tag + ': seeking back does not restore line ' + j); });
    return out;`, {}, {withHidden: true});
  report(ID, 'dependent geometry', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Preset consistency: the before and after values differ; the before value names the exhibits of links.a, the after
// value those of afterLinks, and the reference plate of B those of links.b (as 1-based numbers); the marker row says the
// supplied marker.
test(`${ID}: every preset substitutes one placed paragraph; the plates name the supplied paragraphs`, async () => {
  const def = (await import('../../src/animations/hearings/LAW-0320.js')).default;
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = [];
  const nums = t => (t.match(/\d+/g) || []).map(Number).sort((a, b) => a - b).join(',');
  const ref = L => L.map(v => v + 1).sort((a, b) => a - b).join(',');
  for (const pr of presets) {
    const q = {...def.defaultParams, ...pr.params};
    if (q.beforeValue === q.afterValue) bad.push(`${pr.name}: the before and after values are the same`);
    if (nums(q.beforeValue) !== ref(q.links.a)) bad.push(`${pr.name}: before value "${q.beforeValue}" vs links.a ${ref(q.links.a)}`);
    if (nums(q.afterValue) !== ref(q.afterLinks)) bad.push(`${pr.name}: after value "${q.afterValue}" vs afterLinks ${ref(q.afterLinks)}`);
    if (nums(q.referencesB) !== ref(q.links.b)) bad.push(`${pr.name}: B's plate "${q.referencesB}" vs links.b ${ref(q.links.b)}`);
    if (q.afterLinks.length !== q.links.a.length) bad.push(`${pr.name}: the substitution changes the number of A's links`);
    if (q.afterLinks.filter(v => !q.links.a.includes(v)).length !== 1) bad.push(`${pr.name}: not exactly one placed paragraph substituted`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

const CHIPS = ['[data-node="b0"]', '[data-node="b1"]', '[data-node="b2"]', '[data-node="b3"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: [...CHIPS, '[data-node="lens-bg"]']});
noOverlapTest(ID, {markers: [...CHIPS, '[data-node="cx-marker"]', '[data-node="src-frame"]', '[data-node$="-dock"]', '[data-node^="rm-link-"][data-node$="-m"]'], opaque: ['[data-node="lens"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {lens: [0.21, 0.8], floorFor: 'if (inLens) return 45; ' + FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="lens-bg"]', '[data-node="cx-marker"]', '[data-node$="-dock"]', '[data-node="src-frame"]', '[data-node="rm-links"]']});
equalWeightTest(ID, {at: [0.1, 1], chips: [['[data-node="rm-card-a"]', '[data-node="rm-card-b"]']], marks: [['[data-node="rm-card-a-g"]', '[data-node="rm-card-b-g"]'], ['[data-node="rm-refs-a-g"]', '[data-node="rm-refs-b-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
lrConsistencyTest(ID);
lrConsistencyTest(ID, {linksOf: q => ({a: q.afterLinks, b: q.links.b}), tag: ' (after the substitution)'});
glyphSideTest(ID, {prefixes: ['rm', 'lz']});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.3, 0.5, 0.62, 0.76, 0.9, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]', at: [0.05, 1]});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="src-frame"]', 'path[data-node^="rm-link-"]']});
textLinesVisibleTest(ID);
placesKeptTest(ID);
linksAnchoredTest(ID);
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
        x.seek(0.1 * x.durationMs); const rest = sz('rm-refs-a-v-before-text');
        x.seek(0.4 * x.durationMs); const lens = sz('lz-refs-a-v-before-text');
        if (rest && lens) { const m = lens / rest; st.push(m); if (m < 1.5) out.push(`${pr.name} ${w}x${h}${el ? ' el' + el.join('x') : ''}: ×${m.toFixed(3)}`); }
        x.destroy(); d.remove();
      }
      return {out, min: Math.min(...st)};
    }, [ID, presets, el]);
    bad.push(...res.out);
    stats[`${vw}x${vh}${el ? ' el' : ''}`] = Math.round(res.min * 1000) / 1000;
    await page.close();
  }
  console.log(`[hearings-10] ${ID} sized-host lens magnification (min): ${JSON.stringify(stats)}`);
  expect(bad, bad.join('\n')).toEqual([]);
});
gluedNumbersTest(ID);
noOneWordLineTest(ID);
