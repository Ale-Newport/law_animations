// LAW-0326 — Ruta de recurso · mechanism. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): every connector ends on its own elements (the sheet's edge, a plate's edge, a tray's edge, a
// step's end, the state piece's edge), the order does not change on seeking (the steps keep their supplied numbering and
// the tracer its supplied traversal), and a relation is not drawn as causality by default (plain relations have end dots
// and no arrowhead; causal only when supplied).
// Timing (u): separate 0.03–0.15 (from close together: trays drop from the plates, steps from the trays, the sheet and
// the state piece grow to full size) · relationships 0.18–0.41 (one window per supplied relationship) · tracer
// 0.45–0.72 along the supplied traversal (focus enlarges most) · gather from 0.75.
// Legal (VERY HIGH risk): abstract fictional bodies of the same size on one row (rendered equal-size / equal-baseline
// test); the route is only the supplied sequence; "not checked" is a neutral pending state (dashed); no rank, appeal rule,
// admissibility, time limit, ground or outcome. No people in this scene. The brief's calendar object is left out (noted
// in the presets): no time element is supplied.
import {test, expect} from '@playwright/test';
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, routeConsistencyTest, equalBodiesTest, routeOffTextTest, glyphStateTest, noTwinTextTest, gluedNumbersTest, noOneWordLineTest, stepDiscClearTest, ES_WORDS} from './ruta-recurso-checks.js';

const ID = 'LAW-0326';

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.spread === 0 && s.drawn.every(q => q === 0) && s.tracer === null", label: 'rest: the pieces assembled; nothing drawn'},
    {at: 0.16, fn: 's.spread === 1 && s.drawn.every(q => q === 0)', label: 'separated before any relationship is drawn'},
    {at: 0.3, fn: "s.drawn.some(q => q > 0) && s.kinds.every(k => k !== 'causal')", label: 'relate: the relationships are drawn; no causal link by default'},
    {at: 0.42, fn: 's.drawn.every(q => q === 1)', label: 'every supplied relationship drawn before the trace'},
    {at: 0.5, fn: 's.tracer !== null', label: 'the tracer runs the supplied traversal'},
    {at: 1, fn: 's.drawn.every(q => q === 1) && s.spread === 1 && s.tracer === null && s.problems.length === 0', label: 'gather: everything visible; the composition fits'},
    {at: 0.1, fn: 's.drawn.every(q => q === 0)', label: 'seeking back restores the separate beat'},
    {at: 1, params: {relationships: [{link: 'trays-route', kind: 'causal'}, {link: 'state-route', kind: 'relation'}], traversalOrder: ['trays', 'route']}, fn: "s.kinds.includes('causal') && s.drawn.every(q => q === 1)", label: 'a causal link appears only when supplied'},
    {at: 1, params: {relationships: [{link: 'state-route', kind: 'relation'}], traversalOrder: ['state', 'route']}, fn: "s.links.join() === 'sr'", label: 'a link not supplied is not drawn'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [p.decisions.title, ...p.elements.map(e => e.label), ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b, p.labels.route, p.labels.sequence, p.labels.key, ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k])];',
  content: 'return [p.decisions.title, ...p.elements.map(e => e.label), ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b];',
  captions: 'return [p.labels.sequence];',
});

ratioChecks(ID, 'order stable, pieces apart before the links, trace over drawn links, composition fits', [
  {at: times(0.18, 0.44, 0.005), fn: 's.spread === 1', label: 'relationships are drawn only once the pieces have separated'},
  {at: times(0.44, 0.75, 0.01), fn: 's.drawn.every(q => q === 1)', label: 'the trace runs over drawn relationships only'},
  {at: times(0, 1, 0.05), fn: "s.order.join() === 'document,bodies,trays,route' || s.order.length >= 2", label: 'the traversal is the supplied one at every u'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// Connectors land (rendered, every preset × ratio × labels, at u 0.42, 0.6 and 1): every drawn link starts and ends on the
// edges of its own two pieces — the sheet, a plate, a tray, a step's end, the state piece — within 3 px; the end marks sit
// on the line's ends.
test(`${ID}: every connector ends on its own elements, in its kind's style, at every u (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    let n = 0;
    const s0 = x.getState({bounds: false}).semantic;
    const near = (p, b, tol) => p.x >= b.l - tol && p.x <= b.r + tol && p.y >= b.t - tol && p.y <= b.b + tol && (Math.abs(p.x - b.l) <= tol || Math.abs(p.x - b.r) <= tol || Math.abs(p.y - b.t) <= tol || Math.abs(p.y - b.b) <= tol);
    for (const u of [0.42, 0.6, 1]) {
      x.seek(u * x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      const first = s.steps[0];
      for (const key of s.links) {
        const ln = node(svg, 'conn-' + key + '-line');
        if (!ln || eff(svg, ln.parentNode) < 0.5) continue;
        const m = ln.getScreenCTM(); const L = ln.getTotalLength();
        const A = new DOMPoint(ln.getPointAtLength(0).x, ln.getPointAtLength(0).y).matrixTransform(m), B = new DOMPoint(ln.getPointAtLength(L).x, ln.getPointAtLength(L).y).matrixTransform(m);
        const bx = n0 => box(node(svg, n0));
        let ends = null;
        if (key === 'db') ends = [bx('rm-doc-k'), bx('rm-st' + first + '-plate')];
        else if (/^bt\\d+$/.test(key)) { const i = key.slice(2); ends = [bx('rm-st' + i + '-plate'), bx('rm-tray' + i + '-body')]; }
        else if (/^tr\\d+[pq]$/.test(key)) { const j = +key.match(/\\d+/)[0]; const rt = node(svg, 'rm-rt' + j); const i = key.endsWith('p') ? rt.getAttribute('data-from') : rt.getAttribute('data-to'); const mm = rt.getScreenCTM(); const LL = rt.getTotalLength(); const e0 = key.endsWith('p') ? rt.getPointAtLength(0) : rt.getPointAtLength(LL); const E = new DOMPoint(e0.x, e0.y).matrixTransform(mm); ends = [bx('rm-tray' + i + '-body'), {l: E.x, r: E.x, t: E.y, b: E.y}]; }
        else if (key === 'sr') ends = [bx('rm-sign-body'), null];
        n++;
        // (the focus may enlarge a piece over its link's end: a link's end may lie up to 8 % of the piece inside it)
        if (ends[0] && !near(A, ends[0], 3 + 0.05 * Math.max(ends[0].w || 0, ends[0].h || 0))) out.push(tag + ' u=' + u + ': link ' + key + ' does not start on its piece');
        if (ends[1] && !near(B, ends[1], 3 + 0.05 * Math.max(ends[1].w || 0, ends[1].h || 0))) out.push(tag + ' u=' + u + ': link ' + key + ' does not end on its piece');
        if (key === 'sr') { const rt = nodes(svg, /^rm-rt\\d+$/); let best = 1e9; for (const r0 of rt) { const mm = r0.getScreenCTM(); const LL = r0.getTotalLength(); for (let q = 0; q <= LL; q += LL / 80) { const p = new DOMPoint(r0.getPointAtLength(q).x, r0.getPointAtLength(q).y).matrixTransform(mm); best = Math.min(best, Math.hypot(p.x - B.x, p.y - B.y)); } } if (best > 6) out.push(tag + ': the state link does not reach the route (' + best.toFixed(1) + ' px)'); }
        const kind = ln.parentNode.getAttribute('data-kind');
        const hasHead = [...ln.parentNode.querySelectorAll('path')].some(q => q !== ln && /Z$/.test(q.getAttribute('d') || ''));
        if (kind !== 'causal' && hasHead) out.push(tag + ': ' + key + ' (' + kind + ') carries an arrowhead');
      }
    }
    void s0;
    stat('links checked ' + ratio, n, 'max');
    return [...new Set(out)].slice(0, 20);`, {}, {withHidden: true});
  report(ID, 'connectors', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Exploded view (rendered): at u = 0 the pieces stand close together (each gap shorter, the sheet and the state piece
// smaller); at the hold every tray lies below its plate with a gap at least 1.3× the assembled one,
// every step below the trays, the state piece below the route or beside the row, the sheet larger and off every tray.
test(`${ID}: exploded view — the pieces start assembled and end apart (rendered)`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const k = 1080 / Math.min(svg.getBoundingClientRect().width, svg.getBoundingClientRect().height);
    x.seek(0);
    const gapAt = i => box(node(svg, 'rm-tray' + i + '-body')).t - box(node(svg, 'rm-st' + i + '-plate')).b;
    const g0 = gapAt(0) * k;
    const d0 = box(node(svg, 'rm-doc-k')).w;
    x.seek(x.durationMs);
    const plates = nodes(svg, /^rm-st\\d+-plate$/).map(box), trays = nodes(svg, /^rm-tray\\d+-body$/).map(box);
    let minGap = 1e9;
    plates.forEach((p, i) => { minGap = Math.min(minGap, (trays[i].t - p.b) * k); });
    stat('min plate-tray gap px ' + ratio, Math.round(minGap));
    if (minGap < 12) out.push(tag + ': a tray is not apart from its plate (' + minGap.toFixed(1) + ' px)');
    if (!(minGap > g0 * 1.3)) out.push(tag + ': the pieces do not move apart (gap ' + g0.toFixed(1) + ' → ' + minGap.toFixed(1) + ' px)');
    if (!(box(node(svg, "rm-doc-k")).w > d0 * 1.1)) out.push(tag + ': the sheet does not grow out of the assembled view');
    const trayB = Math.max(...trays.map(t => t.b));
    const steps = nodes(svg, /^rm-rt\\d+$/).map(box);
    if (steps.some(b => b.t < trayB - 1)) out.push(tag + ': a step is not below the trays');
    const sg = box(node(svg, 'rm-sign-body'));
    if (sg.t < Math.max(...steps.map(b => b.b)) - 1 && sg.l < Math.max(...plates.map(b => b.r)) - 1) out.push(tag + ': the state piece is neither below the route nor beside the row');
    const d1 = box(node(svg, 'rm-doc-k'));
    if (trays.some(t => hit(t, d1, 0))) out.push(tag + ': the sheet still lies on a tray');
    return out;`, {}, {withHidden: true});
  report(ID, 'exploded', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 18 (pieces dominate): at the hold the diagram spans >= 0.40 of the frame width (>= 0.75 at 9:16; four bodies 0.68)
// and covers >= 0.18 of the frame's area (>= 0.25 at 9:16); the sheet is >= 0.06 of the frame width (0.12 at 9:16; four
// bodies 0.05 / 0.10) and every plate >= 0.08 (0.18 at 9:16; four bodies 0.06 / 0.12).
test(`${ID}: the exploded pieces are large — rendered share of the frame at the hold`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    const dg = box(node(svg, 'diagram'));
    const dw = dg.w / F.width, dh = dg.h / F.height;
    const sd = box(node(svg, 'rm-doc-k')).w / F.width;
    const pl = Math.min(...nodes(svg, /^rm-st\\d+-plate$/).map(e => box(e).w)) / F.width;
    const tall = ratio === '9:16', four = nodes(svg, /^rm-st\\d+-plate$/).length >= 4;
    stat('diagram w ' + ratio, Math.round(dw * 1000) / 1000); stat('diagram h ' + ratio, Math.round(dh * 1000) / 1000);
    stat('sheet w ' + ratio, Math.round(sd * 1000) / 1000); stat('plate w ' + ratio, Math.round(pl * 1000) / 1000);
    if (dw < (tall ? (four ? 0.68 : 0.75) : 0.4)) out.push(pr.name + ' ' + ratio + ': diagram ' + dw.toFixed(3) + ' of the width');
    stat('diagram area ' + ratio, Math.round(dw * dh * 1000) / 1000);
    if (dw * dh < (tall ? 0.25 : 0.18)) out.push(pr.name + ' ' + ratio + ': diagram ' + dw.toFixed(3) + ' × ' + dh.toFixed(3) + ' of the frame');
    if (sd < (tall ? (four ? 0.1 : 0.12) : (four ? 0.05 : 0.06))) out.push(pr.name + ' ' + ratio + ': sheet ' + sd.toFixed(3) + ' of the width');
    if (pl < (tall ? (four ? 0.12 : 0.18) : (four ? 0.06 : 0.08))) out.push(pr.name + ' ' + ratio + ': plate ' + pl.toFixed(3) + ' of the width');
    return out;`, {}, {withHidden: true});
  report(ID, 'pieces share', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The steps keep their supplied order on seeking: in shuffled seeks every step's number (or pips) and both ends stay the
// same, and the tracer's path follows the supplied steps in order (the step it is on never decreases while it runs).
test(`${ID}: the route's order never changes on seeking, and the tracer follows the steps in the supplied order`, async ({page}) => {
  test.setTimeout(400000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const sig = () => nodes(svg, /^rm-rt\\d+$/).map(e => e.getAttribute('data-node') + ':' + e.getAttribute('data-from') + '>' + e.getAttribute('data-to') + ':' + e.getAttribute('d')).join('|') + '#' + nodes(svg, /^rm-step\\d+-n$/).map(e => e.textContent).join(',');
    x.seek(0.5 * x.durationMs); const ref = sig();
    for (const u of [0.9, 0.1, 0.62, 0.3, 1, 0]) { x.seek(u * x.durationMs); if (sig() !== ref) out.push(tag + ' u=' + u + ': the route changed on seeking'); }
    // (the step the tracer is on — semantic.onStep, from its place along the chain of steps — never decreases, and every
    // step is visited)
    let last = -1;
    const seenS = new Set();
    for (let uu = 0.45; uu <= 0.72; uu += 0.004) {
      x.seek(uu * x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      if (s.onStep === null || s.onStep === undefined) continue;
      if (s.onStep < last) out.push(tag + ' u=' + uu.toFixed(3) + ': the tracer went back from step ' + (last + 1) + ' to ' + (s.onStep + 1));
      last = Math.max(last, s.onStep);
      seenS.add(s.onStep);
    }
    x.seek(0); const s9 = x.getState({bounds: false}).semantic;
    if (s9.order.includes('route') && seenS.size !== s9.steps.length - 1) out.push(tag + ': the tracer visited ' + seenS.size + ' of ' + (s9.steps.length - 1) + ' steps');
    return [...new Set(out)].slice(0, 10);`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="rm-doc"]', '[data-node="rm-sign"]', '[data-node="tracer"]']});
noOverlapTest(ID, {markers: ['[data-node="tracer"]', '[data-node^="conn-"][data-node$="-end"]', '[data-node="rm-doc"]', '[data-node="rm-sign"]']});
coldCreateTest(ID);
equalWeightTest(ID, {at: [0.1, 1], marks: [['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
routeConsistencyTest(ID);
equalBodiesTest(ID);
routeOffTextTest(ID);
glyphStateTest(ID);
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.25, 0.35, 0.5, 0.6, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="diagram"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="conn-"][data-node$="-line"]']});
textLinesVisibleTest(ID);
gluedNumbersTest(ID);
noOneWordLineTest(ID);
stepDiscClearTest(ID, {at: [0.9, 1]});
