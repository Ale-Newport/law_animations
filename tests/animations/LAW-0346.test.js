// LAW-0346 — Sustitución de decisión · mechanism. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): every connector ends on its own element (anchored to the facing edges of its two components,
// model and render), the traversal order does not change when seeking (the tracer visits the components in the supplied
// order whatever the seek history), and a plain relation is never drawn as causation (no head on a relation; a head
// only on sequence / causal, and causal only when supplied).
// Timing (u): separate 0–0.18 (the cards rise from their places; tokens stay; captions in 0.12–0.17) · relationships drawn
// one after another 0.18–0.43 · tracer 0.44–0.74 (focus enlarges as it passes; ◆ token into the position 0.56–0.68
// pushing the ● token into the history pocket 0.60–0.68) · states 0.75–0.80; assembled hold.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, equalWeightTest, neutralityTest, seekHistoryTest,
  fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {linesOffTextTest, textLinesVisibleTest} from './exposicion-inicial-checks.js';
import {noTwinTextTest} from './ruta-recurso-checks.js';

const ID = 'LAW-0346';
const ES_WORDS = ['Position', 'board', 'fictional', 'Initial', 'Later', 'supplied', 'placeholder', 'Note', 'Intake', 'tray', 'History', 'pocket', 'Card', 'card', 'Order', 'conclusion', 'Kept', 'Now', 'holder', 'frame', 'Line', 'relation', 'sequence'];
const BANNED = /(\bvalid|v[aá]lid|invalid|\bwrong|incorrect|\berror|err[oó]ne|correct[oa]?\b|\bright\b|better|mejor|peor|\bworse|winner\b(?!,)|ganador(?!,)|\bwins?\b|\bloses?\b|pierde|verdict|veredicto|\bfallo\b|judgment|judgement|\bruling|sentenci|revers|revoca|confirm|upheld|uphold|overrul|anul|annul|nulidad|\bvoid\b|appeal|apelaci|recurs|casaci|\bcourt\b|tribunal|\bjudge|\bjuez|magistrad|superior|inferior|hierarch|jerarqu|\bplazo|deadline|time limit|\bdue\b|\bmust\b|\bdebe|required|obligatori|binding|vinculante|\bfirme\b|\bfinal\b|definitiv|\blaw\b|\bley\b|guilt|culpab|liab|responsab)/i;
const AT_CARDS = [0.2, 0.5, 1];
const PAIRS = [['mc-a-body', 'mc-b-body']];

contractSuite(ID, {
  continuity: ['cardB', 'cardA', 'tokenB', 'tokenA', 'tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.lift === 0 && s.positionHolds === 'a' && s.linksDrawn.every(v => v === 0) && s.tracer === null", label: 'separate: the cards lie in their places; nothing is linked yet'},
    {at: 0.17, fn: 's.lift === 1 && s.cardText === 1 && s.linksDrawn.every(v => v === 0)', label: 'the cards have risen to the upper tier before any relationship is drawn'},
    {at: 0.44, fn: 's.linksDrawn.every(v => v === 1) && s.positionHolds === \'a\'', label: 'only the supplied relationships are drawn, before the tracer and the change'},
    {at: 0.5, fn: "s.links.every(k => k.kind === 'relation' ? !k.arrow : k.kind === 'sequence' || k.kind === 'causal' ? k.arrow : true)", label: 'a plain relation has no head; sequence / causal have one (causal only as supplied)'},
    {at: 0.7, fn: "s.positionHolds === 'b' && s.historyHolds === 'a'", label: 'the part that changes: the ◆ token in the position, the ● token in the history pocket'},
    {at: 1, fn: "s.beat === 'assembled' && s.states === 1 && s.visited.join() === s.visitOrder.join() && s.problems.length === 0", label: 'hold: assembled, every component visited in the supplied order, states shown; the composition fits'},
    {at: 0.6, fn: "s.visitOrder.join() === ['intake', 'later', 'position', 'initial', 'history'].join()", label: 'the tracer follows the supplied traversal order'},
    {at: 1, params: {traversalOrder: ['history', 'initial', 'position', 'later', 'intake']}, fn: "s.visitOrder.join() === 'history,initial,position,later,intake'", label: 'another supplied order is followed as supplied'},
    {at: 1, params: {relationships: [{from: 'later', to: 'position', kind: 'causal'}]}, fn: "s.links.length === 1 && s.links[0].kind === 'causal' && s.links[0].arrow", label: 'a causal link is drawn only when it is supplied'},
    {at: 0.3, fn: "s.beat === 'relations' && s.positionHolds === 'a'", label: 'seeking back restores the earlier state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const lab = id => (p.elements.find(e => e.id === id) || {}).label; const kinds = [...new Set(p.relationships.map(q => q.kind))]; return [p.decisions.position, p.decisions.initial, p.decisions.later, p.grounds, p.routes.intake, p.routes.history, p.outcomes.position, p.outcomes.history, p.labels.order, p.labels.key, ...['intake', 'later', 'position', 'initial', 'history'].map(lab).filter(Boolean), ...kinds.map(k => p.relationLabels[k])];",
  content: 'return [p.decisions.position, p.decisions.initial, p.decisions.later, p.routes.intake, p.routes.history, p.outcomes.position, p.outcomes.history];',
  captions: 'return [p.labels.order, ...Object.values(p.relationLabels)];',
});

// Connectors land on their own elements (model): each end lies on (within 16 units of) the facing edge of its element,
// in every preset × ratio, labels shown and hidden.
ratioChecks(ID, 'connectors end on their own elements; tracer order stable; composition fits', [
  {at: [0.5, 1], fn: "s.links.every(k => { const d = (p, b) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h))); const A = s.boxes[k.from], B = s.boxes[k.to]; return d(k.a, A) <= 16 && d(k.b, B) <= 24 && d(k.a, B) > 4 && d(k.b, A) > 4; })", label: 'each connector starts at its source and ends at its target'},
  {at: times(0.44, 0.74, 0.02), fn: 's.visited.every((id, i) => s.visitOrder[i] === id)', label: 'the tracer visits the components in the supplied order'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
  {at: [0.1, 0.5, 1], fn: "Object.values(s.boxes).every(b => b.x >= -1 && b.y >= -1)", label: 'components inside the design space'},
]);

// Rendered: every drawn connector's two ends touch the rendered boxes of its two components (within 12 px).
test(`${ID}: rendered connectors end on their components (every preset × ratio)`, async ({page}) => {
  test.setTimeout(400000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    const nodeOf = id => id === 'later' ? node(svg, 'mc-b-body') : id === 'initial' ? node(svg, 'mc-a-body') : node(svg, 'mc-' + id + '-body');
    const lines = nodes(svg, /^mc-l\\d+-p$/);
    if (lines.length !== s.links.length) out.push(pr.name + ' ' + ratio + ': ' + lines.length + ' lines for ' + s.links.length + ' relationships');
    lines.forEach((ln, i) => {
      const k = s.links[i];
      const m = ln.getScreenCTM(); const L = ln.getTotalLength();
      const p0 = new DOMPoint(ln.getPointAtLength(0).x, ln.getPointAtLength(0).y).matrixTransform(m), p1 = new DOMPoint(ln.getPointAtLength(L).x, ln.getPointAtLength(L).y).matrixTransform(m);
      const d = (p, b) => Math.hypot(Math.max(b.l - p.x, 0, p.x - b.r), Math.max(b.t - p.y, 0, p.y - b.b));
      const A = box(nodeOf(k.from)), B = box(nodeOf(k.to));
      if (d(p0, A) > 12 || d(p1, B) > 16) out.push(pr.name + ' ' + ratio + ': connector ' + k.from + ' → ' + k.to + ' does not land (' + d(p0, A).toFixed(1) + ', ' + d(p1, B).toFixed(1) + ')');
    });
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="mc-cardA"]', '[data-node="mc-cardB"]']});
noOverlapTest(ID, {markers: ['[data-node="mc-tracer"]', '[data-node="mc-tokB-at"]', '[data-node="mc-tokA-at"]', '[data-node="mc-cardA"]', '[data-node="mc-cardB"]']});
coldCreateTest(ID);
equalWeightTest(ID, {at: [0.2, 0.6, 1], marks: [['[data-node="mc-a-glyph-g"]', '[data-node="mc-b-glyph-g"]'], ['[data-node="mc-tokA-g"]', '[data-node="mc-tokB-g"]']]});
neutralityTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.65, 0.8, 1]});
fillMostTest(ID);
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
noTwinTextTest(ID);
linesOffTextTest(ID, {lines: ['[data-node^="mc-l"][data-node$="-p"]', '[data-node^="mc-l"][data-node$="-q"]']});
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
