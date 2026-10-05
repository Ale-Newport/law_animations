// LAW-0347 — Sustitución de decisión · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist (two complete tables, same scale, side by side on wide/square frames and
// stacked on tall ones), exactly the indicated fact is modified (only whether a later card is supplied to scene B's
// intake tray; everything else — rail, card A, participant, gesture — is identical, and identical before the change
// beat with labels shown and hidden), and no legal consequence is invented to complete the contrast (no winner, score
// or verdict; the neutral note says so; card A stays whole and visible in both scenes).
// Timing (u): base 0–0.17 · card B supplied to B's tray 0.18–0.30 · both reach 0.31–0.39 · B: slide and push 0.41–0.69;
// A: the hands find the tray empty and withdraw 0.50–0.56 · release 0.69–0.73 · thread 0.71–0.77 · guide rings and
// guide row 0.78–0.84 · neutral note 0.80–0.86; hold. People floors: >= 60 px off 1:1, >= 55 px at 1:1, stress >= 45.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, equalWeightTest,
  neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {textLinesVisibleTest} from './exposicion-inicial-checks.js';
import {noTwinTextTest} from './ruta-recurso-checks.js';

const ID = 'LAW-0347';
const FLOOR_FOR = "const st = preset.replace(' (labels hidden)', '') === 'long-labels-stress'; if (st) return 45; return ratio === '1:1' ? 55 : 60;";
const ES_WORDS = ['Position', 'board', 'fictional', 'Initial', 'Later', 'supplied', 'placeholder', 'card', 'Card', 'Order', 'conclusion', 'Changed', 'Same', 'rail', 'participant', 'gesture', 'Only', 'differs', 'winner', 'situations'];
const BANNED = /(\bvalid|v[aá]lid|invalid|\bwrong|incorrect|\berror|err[oó]ne|correct[oa]?\b|\bright\b|better|mejor|peor|\bworse|\bwins?\b|\bloses?\b|pierde|verdict|veredicto|\bfallo\b|judgment|judgement|\bruling|sentenci|revers|revoca|confirm|upheld|uphold|overrul|anul|annul|nulidad|\bvoid\b|appeal|apelaci|recurs|casaci|\bcourt\b|tribunal|\bjudge|\bjuez|magistrad|superior|inferior|hierarch|jerarqu|\bplazo|deadline|time limit|\bdue\b|\bmust\b|\bdebe|required|obligatori|binding|vinculante|\bfirme\b|\bfinal\b|definitiv|\blaw\b|\bley\b|guilt|culpab|liab|responsab)/i;
const AT_CARDS = [0.1, 0.5, 1];
const PAIRS = [['rb-a-body', 'rb-b-body'], ['ra-a-body', 'rb-a-body'], ['ra-badge', 'rb-badge']];

contractSuite(ID, {
  continuity: ['aCardA', 'bCardA', 'bCardB', 'aPerson', 'bPerson', 'aHandL', 'aHandR', 'bHandL', 'bHandR'],
  attach: [{from: 0.395, to: 0.685, a: 'bHandL', b: 'bGripL', tol: 1.5}, {from: 0.395, to: 0.685, a: 'bHandR', b: 'bGripR', tol: 1.5}],
  semantic: [
    {at: 0.1, fn: "JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.position === 'A' && s.lookA.intake === 'empty' && s.lookA.history === 'empty'", label: 'base: the same situation twice (card A in each position, trays and pockets empty)'},
    {at: 0.36, fn: "s.lookB.intake === 'card B' && s.lookA.intake === 'empty' && s.lookA.position === 'A' && s.lookB.position === 'A'", label: 'the one changed fact, localised: only B\'s tray receives a later card'},
    {at: 0.75, fn: "s.lookB.position === 'B' && s.lookB.history === 'A' && s.lookA.position === 'A' && s.lookA.history === 'empty'", label: 'in parallel: in B card B occupies the position and card A is kept in the pocket; in A card A stays'},
    {at: 1, fn: "s.guide === 1 && s.note === 1 && s.sameScale && s.arrangement === 'row' && s.allReached && s.problems.length === 0", label: 'hold: the guide and the neutral note shown; same scale; side by side on 16:9; composition fits'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.lookB.intake !== 'empty' && s.lookA.intake === 'empty'", label: 'labels hidden: the same localised change'},
    {at: 0.12, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB)", label: 'seeking back restores the identical base exactly'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [p.decisions.position, p.decisions.initial, p.decisions.later, p.labels.order, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...(p.sharedFacts || []), p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  content: 'return [p.decisions.position, p.decisions.initial, p.decisions.later, p.scenarioA.label, p.scenarioB.label, p.changedFact];',
  captions: 'return [p.labels.order];',
});

ratioChecks(ID, 'same scale, arrangement per ratio, reach, composition fits', [
  {at: [0, 0.5, 1], fn: 's.sameScale', label: 'the two scenes have the same scale'},
  {at: [0.5], ratios: ['9:16', '1:1'], fn: "s.arrangement === 'column'", label: 'stacked on tall and square frames (square: beside a text column)'},
  {at: [0.5], ratios: ['16:9'], fn: "s.arrangement === 'row'", label: 'side by side on wide frames'},
  {at: times(0.3, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
  {at: times(0, 1, 0.02), fn: "s.lookA.position === 'A' && s.lookA.history === 'empty'", label: 'scene A never changes what its position holds (no invented consequence)'},
]);

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="ra-p0"]', '[data-node="rb-p0"]', '[data-node="rb-cardB"]']});
noOverlapTest(ID, {markers: ['[data-node="ra-p0-head"]', '[data-node="rb-p0-head"]', '[data-node="ra-ring"]', '[data-node="rb-ring"]', '[data-node="rb-cardB"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^r[ab]-p0$', floorFor: FLOOR_FOR});
headsClearTest(ID, {heads: '^r[ab]-p0-head$', covers: ['[data-node="rb-cardB"]', '[data-node="ra-cardA"]', '[data-node="rb-cardA"]', '[data-node="ra-ring"]', '[data-node="rb-ring"]']});
// (the A/B scenario badges keep their lane colours, as AUTHORING allows; they are compared for size in the card test)
equalWeightTest(ID, {at: [0.1, 0.5, 1], marks: [['[data-node="rb-a-glyph-g"]', '[data-node="rb-b-glyph-g"]']], chips: [['[data-node="ra-label"]', '[data-node="rb-label"]']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.15, 0.25, 0.45, 0.6, 0.75, 0.9, 1]});
fillMostTest(ID);
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
noTwinTextTest(ID);
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
