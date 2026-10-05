// LAW-0348 — Sustitución de decisión · inspect. Contract battery + the lens checklist (AUTHORING "inspect"), rendered.
// acceptanceCheck (brief): the detail keeps its source coordinates (a real enlarged copy of the same table, cropped on
// the record plate and its dock), the change is localised (one supplied datum: the value on the position's record
// plate; only its dependent state follows — card B slides into the position and pushes card A into the history
// pocket), and seeking back restores the previous datum exactly.
// Timing (u): build 0–0.20 · frame 0.18–0.205, panel out, context copy out with the lens copy in, context steps back,
// lens opens · old value into the dock as "was" while the new value comes in 0.54–0.585 (labels hidden: glyph and pips
// change 0.50–0.585) · dependent state 0.60–0.68 · close 0.728–0.744, forward, context copy in · panel in 0.744–0.762 ·
// marker 0.80–0.83. Lens floors (AUTHORING): magnification >= 1.5× vs the context at rest (plate and text), smaller side
// >= 0.36 of the short side, visible context >= 0.45 (stacked: either dimension, span >= 0.8), one legible copy of the
// datum at a time (hand-over <= 180 ms), panel never with the lens. No people in this scene.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, equalWeightTest, neutralityTest, noArrowsTest,
  seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';

const ID = 'LAW-0348';
const ES_WORDS = ['Position', 'board', 'fictional', 'Initial', 'Later', 'supplied', 'placeholder', 'card', 'Card', 'Order', 'conclusion', 'Changed', 'registry', 'table', 'record', 'label', 'was', 'result'];
const BANNED = /(\bvalid|v[aá]lid|invalid|\bwrong|incorrect|\berror|err[oó]ne|correct[oa]?\b|\bright\b|better|mejor|peor|\bworse|winner|ganador|\bwins?\b|\bloses?\b|pierde|verdict|veredicto|\bfallo\b|judgment|judgement|\bruling|sentenci|revers|revoca|confirm|upheld|uphold|overrul|anul|annul|nulidad|\bvoid\b|appeal|apelaci|recurs|casaci|\bcourt\b|tribunal|\bjudge|\bjuez|magistrad|superior|inferior|hierarch|jerarqu|\bplazo|deadline|time limit|\bdue\b|\bmust\b|\bdebe|required|obligatori|binding|vinculante|\bfirme\b|\bfinal\b|definitiv|\blaw\b|\bley\b|guilt|culpab|liab|responsab)/i;
const AT_CARDS = [0.1, 1];
const PAIRS = [['rm-a-body', 'rm-b-body']];

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.cards === 'before'", label: 'build: the context at full size with the supplied before value; no lens'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoomVsRest >= 1.5 && s.ctxCopy === 0 && s.lensCopy === 1 && !s.bothCopies && s.panel === 0', label: 'isolate: a real enlargement (>= 1.5x) holds the datum; the context copy is hidden; the panel is out'},
    {at: 0.5, fn: "s.datum === 'changing' && s.strike === 0 && s.docked > 0 && s.cards === 'before'", label: 'substitute: the old value moves, unchanged and never struck, towards the dock first'},
    {at: 0.59, fn: "s.datum === 'after' && s.docked === 1 && s.newShown === 1 && s.cards === 'before'", label: 'the new value comes before its dependent state changes'},
    {at: 0.7, fn: "s.cards === 'after' && s.lensOpen === 1", label: 'then only the dependent state follows: card B in the position, card A in the history pocket'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.ctxCopy === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.docked === 1 && s.panel === 1 && s.strike === 0 && s.problems.length === 0", label: 'hold: new value, old value docked (traceable), marker; the composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.docked === 0 && s.cards === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.cards === 'after' && s.lensOpen === 1", label: 'labels hidden: the same localised change'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [p.decisions.position, p.decisions.initial, p.decisions.later, p.afterValue, p.beforeValue, p.labels.order, p.labels.key, p.contextLabels.context, p.contextLabels.marker];',
  content: 'return [p.decisions.position, p.decisions.initial, p.decisions.later, p.afterValue, p.beforeValue];',
  captions: 'return [p.labels.order, p.contextLabels.context];',
});

ratioChecks(ID, 'lens sequencing: one copy at a time, panel never with the lens, new value still, composition fits', [
  {at: times(0.2, 0.3, 0.0025), fn: '!s.bothCopies', label: 'open: the two copies of the datum are never both shown'},
  {at: times(0.7, 0.8, 0.0025), fn: '!s.bothCopies', label: 'close: the two copies of the datum are never both shown'},
  {at: times(0.2, 0.82, 0.005), fn: 's.panel < 0.02 || s.lensOpen < 0.01', label: 'the text panel and the lens are never shown together'},
  {at: [0.59, 0.62, 0.65, 0.68, 0.71], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [0.3, 0.45, 0.6, 0.7], fn: 's.zoomVsRest >= 1.5 && s.lensMinSide >= 0.36', label: 'the lens magnifies >= 1.5x and its smaller side >= 0.36 of the short side (model)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// Rendered lens checklist (every preset × ratio × labels shown and hidden).
test(`${ID}: rendered lens: smaller side, magnification vs rest (plate and text), context kept, pieces whole, copies sequenced`, async ({page}) => {
  test.setTimeout(900000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const s0 = svg.getScreenCTM().a;
    const fw = w * s0, fh = h * s0;
    const scaleOf = e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); };
    x.seek(0.1 * x.durationMs);
    const restPlate = box(node(svg, 'rm-rec-body')).w;
    const t0 = node(svg, 'rm-rec-v-before-text');
    const restText = t0 ? parseFloat(getComputedStyle(t0).fontSize) * scaleOf(t0) : null;
    for (const u of [0.32, 0.4, 0.5, 0.6, 0.7]) {
      x.seek(u * x.durationMs);
      const L = box(node(svg, 'lens-bg'));
      const side = Math.min(L.w, L.h) / Math.min(fw, fh);
      if (side < 0.36) out.push(tag + ' u=' + u + ': lens smaller side ' + side.toFixed(3));
      const mag = box(node(svg, 'lz-rec-body')).w / restPlate;
      if (mag < 1.5) out.push(tag + ' u=' + u + ': plate magnification ' + mag.toFixed(2));
      const lt = node(svg, 'lz-rec-v-before-text');
      if (restText && lt) { const tm = parseFloat(getComputedStyle(lt).fontSize) * scaleOf(lt) / restText; if (tm < 1.5) out.push(tag + ' u=' + u + ': text magnification ' + tm.toFixed(2)); }
      const C = box(node(svg, 'rm-walls'));
      if (hit(C, L, 1)) out.push(tag + ' u=' + u + ': the lens overlaps the context room');
      const cw = C.w / fw, ch = C.h / fh;
      if (h > w * 1.2) {
        const span = (Math.max(C.r, L.r) - Math.min(C.l, L.l)) / fw;
        if (Math.max(cw, ch) < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(2) + ' × ' + ch.toFixed(2));
        if (span < 0.8) out.push(tag + ' u=' + u + ': context + lens span ' + span.toFixed(2));
      } else if (cw < 0.45) out.push(tag + ' u=' + u + ': context ' + cw.toFixed(3) + ' of the frame width');
      for (const nm of ['lz-rec', 'lz-dock']) { const b = box(node(svg, nm)); if (b.l < L.l - 1 || b.r > L.r + 1 || b.t < L.t - 1 || b.b > L.b + 1) out.push(tag + ' u=' + u + ': ' + nm + ' is cut by the lens rim'); }
    }
    const copies = pre => ['before', 'after'].map(k => node(svg, pre + '-rec-v-' + k)).filter(Boolean);
    let gapRun = 0, worstGap = 0, both = 0;
    for (let ms = 0.2 * x.durationMs; ms <= 0.82 * x.durationMs; ms += 1000 / 60) {
      x.seek(ms);
      const c = Math.max(0, ...copies('rm').map(e => eff(svg, e)));
      const l = Math.max(0, ...copies('lz').map(e => eff(svg, e)));
      if (c >= 0.15 && l >= 0.15) both++;
      const mc = Math.max(...['rm-rec-a', 'rm-rec-b'].map(n => eff(svg, node(svg, n)))), ml = Math.max(...['lz-rec-a', 'lz-rec-b'].map(n => eff(svg, node(svg, n))));
      if (mc >= 0.15 && ml >= 0.15 && eff(svg, node(svg, 'lens')) > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: the glyph is shown in the context and in the lens');
      gapRun = c < 0.15 && l < 0.15 ? gapRun + 1000 / 60 : 0;
      worstGap = Math.max(worstGap, gapRun);
      if (eff(svg, node(svg, 'lens')) > 0.02 && eff(svg, node(svg, 'panel')) > 0.02) out.push(tag + ' ' + Math.round(ms) + ' ms: panel and lens shown together');
    }
    if (both) out.push(tag + ': both copies >= 0.15 in ' + both + ' frames');
    if (worstGap > 180) out.push(tag + ': no copy of the datum legible for ' + Math.round(worstGap) + ' ms');
    return [...new Set(out)].slice(0, 30);`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden: inside the open lens the glyph changes ● → ◆ and the pips from one dot to two; the context shows the
// new marks right after the close; the dock keeps a mark of the old datum.
test(`${ID}: labels hidden — the record's glyph and pips change inside the open lens; the context shows the new marks after the close`, async ({page}) => {
  test.setTimeout(600000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    if (!/labels hidden/.test(pr.name)) return out;
    const tag = pr.name + ' ' + ratio;
    const op = n => eff(svg, node(svg, n));
    x.seek(0.45 * x.durationMs);
    if (op('lens') < 0.95 || op('lz-rec-a') < 0.5 || op('lz-rec-b') > 0.05 || op('lz-rec-p1') < 0.5) out.push(tag + ': before the change the lens does not show the old marks alone');
    if (op('rm-rec-a') >= 0.15) out.push(tag + ': the context shows its glyph while the lens holds it');
    x.seek(0.66 * x.durationMs);
    if (op('lens') < 0.95 || op('lz-rec-b') < 0.5 || op('lz-rec-a') > 0.05 || op('lz-rec-p2') < 0.5) out.push(tag + ': after the change the lens does not show the new marks alone');
    if (op('lz-dock-v') < 0.5) out.push(tag + ': the old datum is not kept in the dock');
    x.seek(0.765 * x.durationMs);
    if (op('rm-rec-b') < 0.95 || op('rm-rec-a') > 0.05) out.push(tag + ': the context does not show the new glyph right after the close');
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Through the hold the new value, the docked old value ("was") and the Δ stay fully visible.
ratioChecks(ID, 'value traceable at the hold', [
  {at: times(0.87, 1, 0.01), tv: ['all'], dom: "(() => { const e = n => svg.querySelector('[data-node=\"' + n + '\"]'); const op = el => { let o = 1; for (let q = el; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; }; return op(e('rm-dock')) > 0.95 && op(e('rm-was')) > 0.95 && op(e('rm-dock-v')) > 0.95 && op(e('rm-rec-v-after')) > 0.95 && op(e('cx-marker')) > 0.95; })()", label: 'rendered: at the hold the new value, the docked old value, its "was" and the Δ marker are fully visible'},
]);

// Panel ↔ lens hand-over: the freed area is never blank (panel and lens both below 0.3) for more than 150 ms.
test(`${ID}: panel ↔ lens hand-over — never both below 0.3 opacity for more than 150 ms (60 fps, open and return)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const [phase, u0, u1] of [['open', 0.15, 0.32], ['return', 0.7, 0.82]]) {
      let run = 0, worst = 0;
      for (let ms = u0 * x.durationMs; ms <= u1 * x.durationMs; ms += 1000 / 60) {
        x.seek(ms);
        const blank = eff(svg, node(svg, 'panel')) < 0.3 && eff(svg, node(svg, 'lens')) < 0.3;
        run = blank ? run + 1000 / 60 : 0;
        worst = Math.max(worst, run);
      }
      if (worst > 150) out.push(pr.name + ' ' + ratio + ' ' + phase + ': panel and lens both below 0.3 for ' + Math.round(worst) + ' ms');
    }
    return out;`, {}, {withHidden: false});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Preset consistency: before and after differ; the before value names card A (initial), the after value card B (later).
test(`${ID}: every preset substitutes the supplied value; the values name their cards`, async () => {
  const def = (await import('../../src/animations/review/LAW-0348.js')).default;
  const bad = [];
  for (const pr of [{name: 'default', params: {}}, ...presetsFor(ID)]) {
    const q = {...def.defaultParams, ...pr.params};
    if (q.beforeValue === q.afterValue) bad.push(`${pr.name}: before and after are the same`);
    if (!/card A|tarjeta A/.test(q.beforeValue) || /card B|tarjeta B/.test(q.beforeValue)) bad.push(`${pr.name}: before value does not name card A`);
    if (!/card B|tarjeta B/.test(q.afterValue) || /card A|tarjeta A/.test(q.afterValue)) bad.push(`${pr.name}: after value does not name card B`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// Lens magnification at SIZED hosts (>= 1.5x on the text at every host size).
test(`${ID}: lens text magnification >= 1.5 at sized hosts (640×360 element, 800×600 and 1400×1000 viewports)`, async ({browser}) => {
  test.setTimeout(600000);
  const bad = [];
  for (const [vw, vh, el] of [[1280, 800, [640, 360]], [800, 600, null], [1400, 1000, null]]) {
    const page = await browser.newPage({viewport: {width: vw, height: vh}});
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const res = await page.evaluate(async ([id, presets, el]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
        const d = document.createElement('div');
        if (el) d.style.cssText = `width:${el[0]}px;height:${el[1]}px`;
        document.getElementById('slots').appendChild(d);
        const x = def.create(d, {width: w, height: h, params: pr.params});
        await x.ready;
        if (el) { x.element.style.width = el[0] + 'px'; x.element.style.height = el[1] + 'px'; }
        const sz = n => { const t = x.element.querySelector('[data-node="' + n + '"]'); if (!t) return null; const m = t.getScreenCTM(); return parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b); };
        x.seek(0.1 * x.durationMs); const rest = sz('rm-rec-v-before-text');
        x.seek(0.4 * x.durationMs); const lens = sz('lz-rec-v-before-text');
        if (rest && lens && lens / rest < 1.5) out.push(`${pr.name} ${w}x${h}${el ? ' el' : ''}: ×${(lens / rest).toFixed(3)}`);
        x.destroy(); d.remove();
      }
      return out;
    }, [ID, presets, el]);
    bad.push(...res);
    await page.close();
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// The Δ marker lies on the table, clear (>= 4 px at 1080p) of the plate, the dock, the cards and every text.
test(`${ID}: the Δ marker stands clear of everything at the hold (every preset × ratio)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const S = svg.getBoundingClientRect(), k = 1080 / Math.min(S.width, S.height);
    const M = box(node(svg, 'cx-marker'));
    const Wl = box(node(svg, 'rm-walls'));
    if (M.l < Wl.l || M.r > Wl.r || M.t < Wl.t || M.b > Wl.b) out.push(pr.name + ' ' + ratio + ': the marker is outside the room');
    let least = 1e9;
    const others = [node(svg, 'rm-rec-body'), node(svg, 'rm-dock-body'), node(svg, 'rm-a-body'), node(svg, 'rm-b-body'), ...texts(svg, 0.3)].filter(e => e && eff(svg, e) >= 0.3);
    for (const o of others) { const c = box(o); const d = Math.max(c.l - M.r, M.l - c.r, c.t - M.b, M.t - c.b) * k; least = Math.min(least, d); }
    if (least < 4) out.push(pr.name + ' ' + ratio + ': the marker is ' + least.toFixed(1) + ' px from another element');
    return out;`, {}, {withHidden: false});
  expect(bad, bad.join('\n')).toEqual([]);
});

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="lens-bg"]']});
noOverlapTest(ID, {markers: ['[data-node="cx-marker"]', '[data-node="src-frame"]', '[data-node="rm-dock"]'], opaque: ['[data-node="lens"]']});
coldCreateTest(ID);
equalWeightTest(ID, {at: [0.1, 1], marks: [['[data-node="rm-rec-a-g"]', '[data-node="rm-rec-b-g"]'], ['[data-node="rm-a-glyph-g"]', '[data-node="rm-b-glyph-g"]']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.3, 0.5, 0.62, 0.76, 0.9, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]', at: [0.05, 1]});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
textLinesVisibleTest(ID);

// Shipped texts (defaults and presets, EN and ES) carry no verdict, rule, institution or time limit.
test(`${ID}: no supplied or default text carries a verdict, rule, institution or time limit`, async () => {
  const def = (await import(`../../src/animations/review/${ID}.js`)).default;
  const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
  const bad = [];
  const walk = (v, p) => { if (typeof v === 'string') { if (BANNED.test(v)) bad.push(`${p}: "${v}"`); } else if (v && typeof v === 'object') for (const [k, w] of Object.entries(v)) walk(w, `${p}.${k}`); };
  for (const pr of all) walk(pr.params, pr.name);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The stress preset is at least as long as the defaults in every text field (and arrays at least as long).
test(`${ID}: long-labels-stress is at least as long as the defaults in every text field`, async () => {
  const def = (await import(`../../src/animations/review/${ID}.js`)).default;
  const st = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  const bad = [];
  const walk = (a, b, p) => {
    if (typeof a === 'string') { if (typeof b === 'string' && b.length < a.length) bad.push(`${p}: ${b.length} < ${a.length}`); }
    else if (Array.isArray(a)) { if (Array.isArray(b) && b.length < a.length) bad.push(`${p}: ${b.length} items < ${a.length}`); }
    else if (a && typeof a === 'object') for (const k of Object.keys(a)) if (b && k in b) walk(a[k], b[k], `${p}.${k}`);
  };
  walk(def.defaultParams, st, 'params');
  expect(bad, bad.join('\n')).toEqual([]);
});

// The two cards are drawn alike wherever both appear: same rendered size, stroke and full opacity (equal weight).
test(`${ID}: both cards keep the same size, stroke and opacity (every preset × ratio)`, async ({page}) => {
  test.setTimeout(400000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const u of arg.at) {
      x.seek(u * x.durationMs);
      for (const [a, b] of arg.pairs) {
        const A = node(svg, a), B = node(svg, b);
        if (!A || !B) continue;
        if (eff(svg, A) < 0.05 || eff(svg, B) < 0.05) continue;
        const p = box(A), q = box(B);
        if (Math.abs(p.w - q.w) > 0.6 || Math.abs(p.h - q.h) > 0.6) out.push(pr.name + ' ' + ratio + ' u=' + u + ': ' + a + ' / ' + b + ' sizes differ');
        if (A.getAttribute('stroke-width') !== B.getAttribute('stroke-width')) out.push(pr.name + ' ' + ratio + ': strokes differ');
        if (Math.abs(eff(svg, A) - eff(svg, B)) > 0.01) out.push(pr.name + ' ' + ratio + ' u=' + u + ': opacities differ');
      }
    }
    return out;`, {at: AT_CARDS, pairs: PAIRS}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});
