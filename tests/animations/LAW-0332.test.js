// LAW-0332 — Solicitud de autorización · inspect. Contract battery + the full lens checklist (AUTHORING line 109)
// rendered (adapted from the review-02 inspect test, LAW-0328, which stays unchanged).
// acceptanceCheck (brief): the detail keeps its source coordinates (a real enlarged copy of the same room), the change is
// localised (one supplied datum: the supplied state on the prior-examination tray's record plate; only its dependent
// state follows in the context — the decision's placeholder sheet in the tray's other slot and the pins), and seeking
// back restores the old datum exactly.
// Timing (u): build 0–0.20 · frame 0.18–0.205, panel out, context copy (value and glyph) out with the lens copy in,
// context steps back, lens opens (tight on the record plate and its empty dock) · the old value enters the dock as the
// record captioned "was" as the new value comes in 0.54–0.585 (no strike; labels hidden: the glyph and the icon change
// 0.50–0.585) · the dependent state follows 0.60–0.68 (old out, then new in) · close 0.728–0.744, forward, context copy
// in · panel in 0.744–0.762 · marker 0.80–0.83.
// Legal (VERY HIGH risk): abstract fictional stations of the same size on one row; the path is only the supplied
// sequence; the prior-examination tray is a neutral tray; ● authorization requested and ◆ decision supplied have equal
// weight; the decision is a placeholder whose content is never shown; neither value is marked as wrong; no leave rule,
// criterion, threshold, time limit, rank or outcome. Lens (coordinator): magnification >= 1.5x on the text at every
// host (sized hosts too; target 1.6x); smaller side >= 0.35 of the short side (0.36, margin); visible context >= 0.45;
// content fill >= 0.40 and text coverage >= 0.30 (no preset needs the LENS TEXT COVERAGE 1:1 LIMIT: semantic textLimit
// is false everywhere — asserted below); nothing cut by the rim; one copy of the datum at a time (value and glyph),
// hand-over <= 180 ms; the new state in the context right after the close. No people in this scene. Omitted brief
// field (see the presets note): grounds.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, routeConsistencyTest, equalBodiesTest, routeAnchoredTest, routeOffTextTest, glyphStateTest, noTwinTextTest, gluedNumbersTest, noOneWordLineTest, stepDiscClearTest, ES_WORDS} from './solicitud-autorizacion-checks.js';

const ID = 'LAW-0332';

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.trayState === 'before' && s.decShown === 0 && s.petitionPin === 1", label: 'build: the context at full size, the petition in the prior-examination tray with its ● pin, the supplied before value on the record; no lens'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoomVsRest >= 1.5 && s.ctxCopy === 0 && s.lensCopy === 1 && !s.bothCopies && s.panel === 0', label: 'isolate: a real enlargement (>= 1.5x the context at rest) holds the datum; the context copy is hidden; the panel is out'},
    {at: 0.5, fn: "s.datum === 'changing' && s.strike === 0 && s.docked > 0 && s.trayState === 'before'", label: 'substitute: the old value moves, unchanged and never struck, towards the dock before anything else changes'},
    {at: 0.59, fn: "s.datum === 'after' && s.docked === 1 && s.newShown === 1 && s.trayState === 'before' && s.decShown === 0 && s.strike === 0", label: 'the new value comes before its dependent state changes'},
    {at: 0.7, fn: "s.trayState === 'after' && s.decShown === 1 && s.petitionPin === 0 && s.lensOpen === 1", label: 'then only the dependent state follows: the decision\'s placeholder sheet in the tray\'s other slot; the petition\'s ● pin gone'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.docked === 1 && s.panel === 1 && s.strike === 0 && s.textLimit === false && s.problems.length === 0", label: 'hold: new value, the old value docked (traceable, not struck), marker; no 1:1 text limit; the composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.docked === 0 && s.trayState === 'before' && s.decShown === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: presetsFor(ID).find(q => q.name === 'contrast-or-alternative').params, fn: "s.stateBefore === 'b' && s.stateAfter === 'a' && s.decShown === 0 && s.petitionPin === 1", label: 'another supplied value: decision supplied becomes authorization requested; the decision sheet leaves; nothing else is inferred'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.trayState === 'after' && s.lensOpen === 1", label: 'labels hidden: the same localised change'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.supplied, ...p.routes.bodies.map(b => b.label), p.afterValue, p.beforeValue, p.outcomes.a, p.outcomes.b, p.labels.route, p.labels.sequence, p.labels.exam, p.labels.key, p.contextLabels.context, p.contextLabels.marker, p.objectLabels.record];",
  content: "return [p.decisions.title, p.decisions.supplied, ...p.routes.bodies.map(b => b.label), p.afterValue, p.outcomes.a, p.outcomes.b];",
  captions: 'return [p.labels.sequence, p.labels.exam, p.contextLabels.context, p.objectLabels.record];',
});

ratioChecks(ID, 'lens sequencing: one copy at a time, panel never with the lens, new value still, sequenced return', [
  {at: times(0.2, 0.3, 0.0025), fn: '!s.bothCopies', label: 'open: the two copies of the datum are never both shown'},
  {at: times(0.7, 0.8, 0.0025), fn: '!s.bothCopies', label: 'close: the two copies of the datum are never both shown'},
  {at: times(0.2, 0.82, 0.005), fn: 's.panel < 0.02 || s.lensOpen < 0.01', label: 'the text panel and the lens are never shown together'},
  {at: [0.59, 0.62, 0.65, 0.68, 0.71], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [0.3, 0.45, 0.6, 0.7], fn: 's.zoomVsRest >= 1.5 && s.lensMinSide >= 0.36', label: 'the lens magnifies >= 1.5x (model) and its smaller side >= 0.36 of the frame short side (model)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// Rendered lens checklist (every preset × ratio × labels shown and hidden): smaller side >= 0.36 of the short side;
// magnification >= 1.5 against the context at REST, on the plate and on the value TEXT; the context stays a real,
// visible scene beside or above the lens (never overlapped; >= 0.45 of the frame width, or — stacked on tall frames — of
// either dimension with context + lens spanning >= 0.8); nothing the rim would cut is drawn; one copy of the datum at a
// time (its value AND its glyph), the lens copy legible within 180 ms of the context copy leaving (open and close); the
// panel never with the lens.
test(`${ID}: rendered lens: smaller side, magnification vs rest (plate and text), context kept, crop pieces whole, copies sequenced`, async ({page}) => {
  test.setTimeout(900000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const s0 = svg.getScreenCTM().a;
    const fw = w * s0, fh = h * s0;
    const scaleOf = e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); };
    x.seek(0.1 * x.durationMs);
    const restPlate = box(node(svg, 'rm-rec-body')).w;
    const t0 = node(svg, 'rm-rec-v-before-text');
    const restText = t0 ? parseFloat(getComputedStyle(t0.querySelector('text')).fontSize) * scaleOf(t0.querySelector('text')) : null;
    for (const u of [0.32, 0.4, 0.5, 0.6, 0.7]) {
      x.seek(u * x.durationMs);
      const L = box(node(svg, 'lens-bg'));
      const side = Math.min(L.w, L.h) / Math.min(fw, fh);
      stat('lens side / short side ' + ratio, Math.round(side * 1000) / 1000);
      if (side < 0.36) out.push(tag + ' u=' + u + ': lens smaller side ' + side.toFixed(3) + ' of the short side');
      const mag = box(node(svg, 'lz-rec-body')).w / restPlate;
      stat('magnification vs rest (plate) ' + ratio, Math.round(mag * 100) / 100);
      if (mag < 1.5) out.push(tag + ' u=' + u + ': lens plate ÷ plate at rest = ' + mag.toFixed(2));
      const lt = node(svg, 'lz-rec-v-before-text');
      if (restText && lt) { const tm = parseFloat(getComputedStyle(lt.querySelector('text')).fontSize) * scaleOf(lt.querySelector('text')) / restText; stat('magnification vs rest (text) ' + ratio, Math.round(tm * 100) / 100); if (tm < 1.5) out.push(tag + ' u=' + u + ': datum text ×' + tm.toFixed(2)); }
      const C = box(node(svg, 'rm-walls'));
      if (hit(C, L, 1)) out.push(tag + ' u=' + u + ': the lens overlaps the context room');
      const cw = C.w / fw, ch = C.h / fh;
      stat('context width share ' + ratio, Math.round(cw * 1000) / 1000);
      if (h > w * 1.2) {
        const span = (Math.max(C.r, L.r) - Math.min(C.l, L.l)) / fw;
        if (Math.max(cw, ch) < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(2) + ' × ' + ch.toFixed(2) + ' of the frame');
        if (span < 0.8) out.push(tag + ' u=' + u + ': context + lens span ' + span.toFixed(2) + ' of the width');
      } else if (cw < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(3) + ' of the frame width');
      for (const e of svg.querySelectorAll('[data-node^="lz-"]')) {
        const nm = e.getAttribute('data-node');
        if (!/^lz-(rec|dock|board|st\\d+|doc|dec|clock|steps|route)$/.test(nm)) continue;
        if (eff(svg, e) < 0.05) continue;
        const b = box(e);
        if (b.w < 1) continue;
        if (b.l < L.l - 1 || b.r > L.r + 1 || b.t < L.t - 1 || b.b > L.b + 1) out.push(tag + ' u=' + u + ': ' + nm + ' is cut by the lens rim');
      }
    }
    const copies = pre => [...svg.querySelectorAll('[data-node^="' + pre + '-rec-v-"]')].filter(e => /-v-(before|after)$/.test(e.getAttribute('data-node')));
    let gapRun = 0, worstGap = 0, both = 0;
    for (let ms = 0.2 * x.durationMs; ms <= 0.82 * x.durationMs; ms += 1000 / 60) {
      x.seek(ms);
      const c = Math.max(0, ...copies('rm').map(e => eff(svg, e)));
      const l = Math.max(0, ...copies('lz').map(e => eff(svg, e)));
      if (c >= 0.15 && l >= 0.15) both++;
      const mc = Math.max(0, ...['rm-rec-a', 'rm-rec-b'].map(n => eff(svg, node(svg, n)))), ml = Math.max(0, ...['lz-rec-a', 'lz-rec-b'].map(n => (node(svg, n) ? eff(svg, node(svg, n)) : 0)));
      if (mc >= 0.15 && ml >= 0.15 && eff(svg, node(svg, 'lens')) > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: the glyph of the record is shown in the context and in the lens');
      gapRun = (copies('rm').length ? c < 0.15 && l < 0.15 : mc < 0.15 && ml < 0.15) ? gapRun + 1000 / 60 : 0;
      worstGap = Math.max(worstGap, gapRun);
      if (eff(svg, node(svg, 'lens')) > 0.02 && eff(svg, node(svg, 'panel')) > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: panel and lens shown together');
    }
    stat('worst copy hand-over gap ms ' + ratio, Math.round(worstGap), 'max');
    if (both) out.push(tag + ': both copies >= 0.15 in ' + both + ' frames');
    if (worstGap > 180) out.push(tag + ': no copy of the datum legible for ' + Math.round(worstGap) + ' ms');
    return [...new Set(out)].slice(0, 30);`, {}, {withHidden: true});
  report(ID, 'lens', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Lens fill (coordinator decision 2026-10-05, LENS FILL METRIC), rendered through the whole open phase (lens opacity >=
// 0.95 at its full size): the drawn lens content — the record plate and the dock tray — covers >= 0.40 of the window, and
// the legible texts in the lens (opacity >= 0.3) >= 0.30 of it, labels shown. The dock tray is in the lens from the
// opening, EMPTY until the substitution; the old value is never legible on the plate and in the dock at once, and the
// dock's record is never legible together with the context's copy of the datum.
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
      for (const e of [node(svg, 'lz-rec-body'), node(svg, 'lz-dock-body')]) if (e && eff(svg, e) >= 0.3) ca += clipA(box(e), L);
      minF = Math.min(minF, ca / A); minT = Math.min(minT, ta / A);
      const dv = node(svg, 'lz-dock-v'), ob = node(svg, 'lz-rec-v-before');
      if (u < 0.54 && dv && eff(svg, dv) > 0.01) out.push(tag + ' u=' + u.toFixed(3) + ': the dock shows the old value before the substitution');
      if (u > 0.6 && dv && eff(svg, dv) < 0.95) out.push(tag + ' u=' + u.toFixed(3) + ': the dock record is not shown after the substitution');
      if (dv && ob && eff(svg, dv) >= 0.15 && eff(svg, ob) >= 0.15) out.push(tag + ' u=' + u.toFixed(3) + ': the old value is legible on the plate and in the dock at once');
      const dk = node(svg, 'lz-dock');
      if (!dk || eff(svg, dk) < 0.95) out.push(tag + ' u=' + u.toFixed(3) + ': the dock tray is not in the lens');
    }
    for (let ms = 0.15 * x.durationMs; ms <= 0.85 * x.durationMs; ms += 1000 / 60) {
      x.seek(ms);
      const dv = node(svg, 'lz-dock-v');
      const cc = Math.max(0, ...['rm-rec-v-before', 'rm-rec-v-after'].map(q => (node(svg, q) ? eff(svg, node(svg, q)) : 0)));
      if (dv && eff(svg, dv) * Math.min(1, eff(svg, lens)) >= 0.15 && cc >= 0.15) out.push(tag + ' ' + Math.round(ms) + ' ms: the dock record and the context copy are both legible');
    }
    // (round 2, 2026-10-05: the documented 1:1 text limit is no longer taken by any preset — the 1:1 fallback wraps the
    // plate's value to a taller block so the board, and the lens window, are near square — so every preset × ratio keeps
    // >= 0.30, and the module never flags semantic.textLimit for the presets)
    x.seek(0.4 * x.durationMs);
    if (x.getState({bounds: false}).semantic.textLimit) out.push(tag + ': takes the 1:1 text limit');
    if (minF < 0.4) out.push(tag + ': lens content fill ' + minF.toFixed(3));
    if (minT < 0.3) out.push(tag + ': lens text coverage ' + minT.toFixed(3));
    if (n < 60) out.push(tag + ': only ' + n + ' open frames sampled');
    stat('min content fill ' + ratio, Math.round(minF * 1000) / 1000);
    stat('min text coverage ' + ratio, Math.round(minT * 1000) / 1000);
    return [...new Set(out)].slice(0, 20);`, {}, {withHidden: false});
  report(ID, 'lens fill', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden: the lens still shows the change without any text — on the record plate the glyph changes ● → ◆ and the
// icon gains the decision's sheet inside the open lens (or back, for the alternative); the context's copy of the glyph is hidden while
// the lens holds it and shows the NEW state right after the close; the dock receives the old glyph.
test(`${ID}: labels hidden — the record's glyph and icon change inside the open lens; the context shows the new state right after the close`, async ({page}) => {
  test.setTimeout(600000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    if (!/labels hidden/.test(pr.name)) return out;
    const tag = pr.name + ' ' + ratio;
    const s = x.getState({bounds: false}).semantic;
    const b0 = s.stateBefore, a0 = s.stateAfter;
    const op = n => (node(svg, n) ? eff(svg, node(svg, n)) : 0);
    x.seek(0.45 * x.durationMs);
    if (op('lens') < 0.95 || op('lz-rec-' + b0) < 0.5 || op('lz-rec-' + a0) > 0.05) out.push(tag + ': before the change the lens does not show the old glyph alone');
    if (op('rm-rec-' + b0) >= 0.15) out.push(tag + ': the context shows its glyph while the lens holds it');
    x.seek(0.66 * x.durationMs);
    if (op('lens') < 0.95 || op('lz-rec-' + a0) < 0.5 || op('lz-rec-' + b0) > 0.05) out.push(tag + ': after the change the lens does not show the new glyph alone');
    if (op('lz-dock-m' + b0) < 0.5) out.push(tag + ': the old glyph is not kept in the dock');
    x.seek(0.765 * x.durationMs);
    if (op('rm-rec-' + a0) < 0.95 || op('rm-rec-' + b0) > 0.05) out.push(tag + ': the context does not show the new glyph right after the close');
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Context text at full opacity at rest (u 0 until the lens opens).
test(`${ID}: the context's record and station texts are fully opaque at rest, before the lens opens`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const u of [0, 0.05, 0.1, 0.15, 0.18, 0.2]) {
      x.seek(u * x.durationMs);
      for (const t of svg.querySelectorAll('[data-node="rm-rec-v-before-text"], [data-node^="rm-st"][data-node$="-text"]')) { const o = eff(svg, t); if (o < 0.999) out.push(pr.name + ' ' + ratio + ' u=' + u + ': ' + t.getAttribute('data-node') + ' opacity ' + o.toFixed(3)); }
    }
    return [...new Set(out)].slice(0, 20);`, {}, {withHidden: false});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Through the hold the new value, the docked old value ("was") and the Δ stay fully visible.
ratioChecks(ID, 'value traceable at the hold', [
  {at: times(0.87, 1, 0.01), tv: ['all'], dom: "(() => { const e = n => svg.querySelector('[data-node=\"' + n + '\"]'); if (!e('rm-dock')) return false; const op = el => { let o = 1; for (let q = el; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; }; return op(e('rm-dock')) > 0.95 && op(e('rm-was')) > 0.95 && op(e('rm-dock-v')) > 0.95 && op(e('rm-rec-v-after')) > 0.95 && op(e('cx-marker')) > 0.95; })()", label: 'rendered: at the hold the new value, the docked old value, its "was" and the Δ marker are fully visible'},
]);

// Panel ↔ lens hand-over: at 60 fps through the open (u 0.15–0.32) and the return (u 0.70–0.82), the freed area is never
// blank — the panel and the lens both below 0.3 opacity — for more than 150 ms (labels shown: the panel exists).
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

// Only the dependent state follows the datum, after it (60 fps): before u 0.6 the tray keeps its before state (the
// petition's ● pin, or the decision's sheet with its ◆ pin); the old one leaves before the new one comes in (the
// petition's ● pin and the decision's sheet never both at >= 0.15); the path stays solid; at the hold the tray shows the
// after state; the stations and the petition never move; seeking back restores the before state.
test(`${ID}: only the decision sheet and the pins change, after the new value, old out before new in`, async ({page}) => {
  test.setTimeout(600000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const op = n => (node(svg, n) ? eff(svg, node(svg, n)) : 0);
    x.seek(0);
    const s0 = x.getState({bounds: false}).semantic;
    const st0 = JSON.stringify(s0.stations);
    const bb = () => { const q = box(node(svg, 'rm-doc-k')); return [q.l, q.t, q.w, q.h]; };
    // (coordinator, review-03: the build carries the petition into the tray over u 0.05–0.15; from u 0.18 it stays put)
    x.seek(0.18 * x.durationMs);
    const d0 = bb();
    x.seek(0);
    const want = st => (st === 'a' ? {pin: 1, dec: 0} : {pin: 0, dec: 1});
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      if (JSON.stringify(s.stations) !== st0) { out.push(tag + ': a station moved'); break; }
      if (ms >= 0.18 * x.durationMs && s.contextScale === 1 && bb().some((v, i) => Math.abs(v - d0[i]) > 0.75)) { out.push(tag + ' ' + Math.round(ms) + ' ms: the petition moved ' + JSON.stringify(bb()) + ' vs ' + JSON.stringify(d0)); break; }
      if (ms < 0.6 * x.durationMs && s.trayState !== 'before') { out.push(tag + ': the dependent state changes before u 0.6'); break; }
      if (s.petitionPin >= 0.15 && s.decShown >= 0.15) { out.push(tag + ' ' + Math.round(ms) + ' ms: the ● pin and the decision sheet shown together'); break; }
      if (nodes(svg, /^rm-rt\\d+$/).some(e => eff(svg, e) < 0.3 * eff(svg, node(svg, 'ctx')) - 0.01) || nodes(svg, /^rm-rd\\d+$/).some(e => eff(svg, e) > 0.01)) { out.push(tag + ': the path is not drawn solid'); break; }
    }
    x.seek(x.durationMs);
    const s1 = x.getState({bounds: false}).semantic;
    const w1 = want(s1.stateAfter);
    if (s1.trayState !== 'after' || s1.decShown !== w1.dec || s1.petitionPin !== w1.pin) out.push(tag + ': the hold does not show the after state');
    if (Math.abs(op('rm-dec') - w1.dec) > 0.05 || Math.abs(op('rm-dec-pin-b') - w1.dec) > 0.05 || Math.abs(op('rm-doc-pin-a') - w1.pin) > 0.05) out.push(tag + ': the drawn tray does not match the after state');
    x.seek(0.3 * x.durationMs);
    const s2 = x.getState({bounds: false}).semantic;
    const w2 = want(s2.stateBefore);
    if (s2.trayState !== 'before' || s2.decShown !== w2.dec || s2.petitionPin !== w2.pin) out.push(tag + ': seeking back does not restore the before state');
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Preset consistency: the before and after values differ, the after state is the other state, and each value names its
// state (authorization requested / decision supplied; autorización solicitada / decisión suministrada).
test(`${ID}: every preset substitutes the supplied state; the values name the supplied states`, async () => {
  const def = (await import('../../src/animations/review/LAW-0332.js')).default;
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = [];
  const word = {a: /authorization requested|autorizaci[oó]n solicitada/i, b: /decision text supplied|decision supplied|decisi[oó]n suministrada/i};
  for (const pr of presets) {
    const q = {...def.defaultParams, ...pr.params};
    if (q.beforeValue === q.afterValue) bad.push(`${pr.name}: the before and after values are the same`);
    const b = q.beforeStatus || 'a', a = b === 'a' ? 'b' : 'a';
    if (!word[b].test(q.beforeValue) || word[a].test(q.beforeValue)) bad.push(`${pr.name}: before value "${q.beforeValue}" does not name state ${b}`);
    if (!word[a].test(q.afterValue) || word[b].test(q.afterValue)) bad.push(`${pr.name}: after value "${q.afterValue}" does not name state ${a}`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// The context caption shown in the hold agrees with the AFTER state (review-02 round-2 lesson): it never mentions a
// decision while the record says "authorization requested" (no decision sheet is drawn then), and never says there is no
// decision while the record says "decision supplied"; it never names an outcome. Every preset, EN and ES (es-only too),
// every ratio, u 0.765–1.
test(`${ID}: the hold caption agrees with the after-state in every preset (EN and ES)`, async ({page}) => {
  test.setTimeout(300000);
  const run = src => forAll(page, ID, src, {}, {withHidden: false});
  const body = `
    const out = [];
    const wrong = {a: /decision|decisi[oó]n|grant|conced|refus|deneg|admit/i, b: /no decision|without (a )?decision|sin decisi|grant|conced|refus|deneg|admit/i};
    for (const u of [0.765, 0.8, 0.9, 1]) {
      x.seek(u * x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      const cap = node(svg, 'ctx-caption');
      if (!cap) { out.push(pr.name + ' ' + ratio + ': no context caption'); continue; }
      if (eff(svg, cap) < 0.3) continue;
      const t = cap.textContent.replace(/\s+/g, ' ');
      if (wrong[s.stateAfter].test(t)) out.push(pr.name + ' ' + ratio + ' u=' + u + ' (after: ' + s.stateAfter + '): "' + t + '"');
    }
    return out;`;
  const {bad} = await run(body);
  const {bad: es} = await forAll(page, ID, `
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const y = (await window.__lib.load(arg.id)).create(el, {width: w, height: h, params: {locale: 'es'}});
    await y.ready;
    const out = [];
    for (const u of [0.765, 0.9, 1]) {
      y.seek(u * y.durationMs);
      const s = y.getState({bounds: false}).semantic;
      const cap = node(y.element, 'ctx-caption');
      const t = cap ? cap.textContent.replace(/\s+/g, ' ') : '';
      if (!cap) out.push('es-only ' + ratio + ': no context caption');
      else if ((s.stateAfter === 'b' ? /sin decisi|conced|deneg|admit/i : /decisi[oó]n|conced|deneg|admit/i).test(t)) out.push('es-only ' + ratio + ' u=' + u + ': "' + t + '"');
    }
    y.destroy(); el.remove();
    return out;`, {id: ID}, {withHidden: false, presets: ['default']});
  bad.push(...es);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Lens magnification at SIZED hosts (coordinator decision 2026-10-04, LAW-0300: >= 1.5x on the text at every host size).
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
        x.seek(0.1 * x.durationMs); const rest = sz('rm-rec-v-before-text');
        x.seek(0.4 * x.durationMs); const lens = sz('lz-rec-v-before-text');
        if (rest && lens) { const m = lens / rest; st.push(m); if (m < 1.5) out.push(`${pr.name} ${w}x${h}${el ? ' el' + el.join('x') : ''}: ×${m.toFixed(3)}`); }
        x.destroy(); d.remove();
      }
      return {out, min: Math.min(...st)};
    }, [ID, presets, el]);
    bad.push(...res.out);
    stats[`${vw}x${vh}${el ? ' el' : ''}`] = Math.round(res.min * 1000) / 1000;
    await page.close();
  }
  console.log(`[review-03] ${ID} sized-host lens magnification (min): ${JSON.stringify(stats)}`);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The Δ marker lies wholly on free floor at the hold: inside the room's walls, clear (>= 4 px at 1080p) of the board, every
// station, every path line and step disc, the sheets and every text.
test(`${ID}: the Δ marker stands on free floor, clear of everything (every preset × ratio)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const S = svg.getBoundingClientRect(), k = 1080 / Math.min(S.width, S.height);
    const M = box(node(svg, 'cx-marker'));
    const Wl = box(node(svg, 'rm-walls'));
    if (M.l < Wl.l || M.r > Wl.r || M.t < Wl.t || M.b > Wl.b) out.push(pr.name + ' ' + ratio + ': the marker is outside the room');
    let least = 1e9;
    const others = [node(svg, 'rm-board-body'), ...nodes(svg, /^rm-st\\d+-plate$/), ...nodes(svg, /^rm-step\\d+-disc$/), node(svg, 'rm-doc-k'), node(svg, 'rm-dec-k'), ...texts(svg, 0.3)].filter(e => e && eff(svg, e) >= 0.3);
    for (const o of others) { const c = box(o); const d = Math.max(c.l - M.r, M.l - c.r, c.t - M.b, M.t - c.b) * k; least = Math.min(least, d); }
    for (const ln of nodes(svg, /^rm-r[td]\\d+$/).filter(e => eff(svg, e) >= 0.3)) {
      const m = ln.getScreenCTM(); const L = ln.getTotalLength();
      for (let s = 0; s <= L; s += 3) { const p = new DOMPoint(ln.getPointAtLength(s).x, ln.getPointAtLength(s).y).matrixTransform(m); const dx = Math.max(M.l - p.x, 0, p.x - M.r), dy = Math.max(M.t - p.y, 0, p.y - M.b); least = Math.min(least, Math.hypot(dx, dy) * k); }
    }
    stat('least marker clearance px ' + ratio, Math.round(least * 10) / 10);
    if (least < 4) out.push(pr.name + ' ' + ratio + ': the marker is ' + least.toFixed(1) + ' px from another element');
    return out;`, {}, {withHidden: false});
  report(ID, 'marker clearance', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="lens-bg"]']});
noOverlapTest(ID, {markers: ['[data-node="cx-marker"]', '[data-node="src-frame"]', '[data-node="rm-dock"]', '[data-node="rm-doc"]', '[data-node="rm-dec"]'], opaque: ['[data-node="lens"]']});
coldCreateTest(ID);
equalWeightTest(ID, {at: [0.1, 1], marks: [['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type'], ['[data-node="rm-rec-a-d-g"]', '[data-node="rm-rec-b-d-g"]'], ['[data-node="rm-doc-pin-a-g"]', '[data-node="rm-dec-pin-b-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
routeConsistencyTest(ID);
equalBodiesTest(ID);
routeAnchoredTest(ID);
routeOffTextTest(ID);
glyphStateTest(ID, {prefixes: ['rm', 'lz']});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.3, 0.5, 0.62, 0.76, 0.9, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]', at: [0.05, 1]});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="src-frame"]']});
textLinesVisibleTest(ID);
gluedNumbersTest(ID);
noOneWordLineTest(ID);
stepDiscClearTest(ID, {at: [0.1, 1], lineGap: 16, discGap: 16});
