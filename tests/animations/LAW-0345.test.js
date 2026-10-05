// LAW-0345 — Sustitución de decisión · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion (card B, card A, the participant and both hands move continuously at
// 60 fps in every ratio), the anchoring of objects (both hands lie on card B's near edge for the whole slide; card B only
// moves while the hands are on it; card A only moves while card B pushes it — they abut from the contact on; A lands
// exactly in the history pocket and B in the position) and the transformation recognisable with labels hidden (the same
// slide and push; the cards keep their ● / ◆ glyph, lane stripe and order pips).
// Timing (u): rest 0–0.15 · hands to card B 0.15–0.21 · slide 0.22–0.62 (contact, then the push) · hands let go
// 0.62–0.67 · the participant steps back 0.65–0.73 · history thread 0.69–0.77 · supplied states 0.73–0.79; still from
// 0.79. Supplied state "pending": nobody moves the cards; a dashed outline (pending) traces the slide.
// Legal: both cards have the same size, stroke and ink (equal weight); the earlier card stays whole and visible; no
// verdict colours, ticks or crosses; no rule, time limit, outcome or jurisdiction. People floors (review = hearings):
// >= 60 px off 1:1, >= 55 px at 1:1; long-labels-stress >= 45 px.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {subjectFrameTest} from './exposicion-inicial-checks.js';
import {noTwinTextTest} from './ruta-recurso-checks.js';

const ID = 'LAW-0345';
const FLOOR_FOR = "const st = preset.replace(' (labels hidden)', '') === 'long-labels-stress'; if (st) return 45; return ratio === '1:1' ? 55 : 60;";
const ES_WORDS = ['Position', 'board', 'fictional', 'Initial', 'Later', 'supplied', 'placeholder', 'Note', 'Intake', 'tray', 'History', 'pocket', 'card', 'Order', 'conclusion', 'Kept', 'Now', 'Wall', 'calendar', 'Holder', 'Participant', 'registry', 'table'];
// Words this motif must never render or ship (verdicts, rules, time limits, institutions). "result" is the brief's own
// neutral comparison word and is allowed.
const BANNED = /(\bvalid|v[aá]lid|invalid|\bwrong|incorrect|\berror|err[oó]ne|correct[oa]?\b|\bright\b|better|mejor|peor|\bworse|winner|ganador|\bwins?\b|\bloses?\b|pierde|verdict|veredicto|\bfallo\b|judgment|judgement|\bruling|sentenci|revers|revoca|confirm|upheld|uphold|overrul|anul|annul|nulidad|\bvoid\b|appeal|apelaci|recurs|casaci|\bcourt\b|tribunal|\bjudge|\bjuez|magistrad|superior|inferior|hierarch|jerarqu|\bplazo|deadline|time limit|\bdue\b|\bmust\b|\bdebe|required|obligatori|binding|vinculante|\bfirme\b|\bfinal\b|definitiv|\blaw\b|\bley\b|guilt|culpab|liab|responsab)/i;

contractSuite(ID, {
  continuity: ['cardB', 'cardA', 'person', 'handL', 'handR'],
  attach: [{from: 0.215, to: 0.615, a: 'handL', b: 'gripL', tol: 1.5}, {from: 0.215, to: 0.615, a: 'handR', b: 'gripR', tol: 1.5}],
  semantic: [
    {at: 0, fn: "s.phase === 'rest' && s.bIn === 'intake' && s.aIn === 'position' && s.reaching === 0 && s.slide === 0", label: 'rest: card B in the intake tray, card A in the position; hands down'},
    {at: 0.145, fn: "s.phase === 'rest' && s.reaching === 0", label: 'nothing happens during the rest beat'},
    {at: 0.215, fn: 's.reaching > 0.99 && s.slide === 0 && s.bIn === \'intake\'', label: 'the hands reach card B before it moves (cause before effect)'},
    {at: 0.3, fn: "s.reaching === 1 && s.slide > 0 && s.slide < s.contactAt && s.aIn === 'position'", label: 'card B slides along the rail; card A has not moved yet'},
    {at: 0.45, fn: "s.reaching === 1 && s.abut === 0 && s.aIn === 'rail' && s.phase === 'pushing'", label: 'card B pushes card A: they abut'},
    {at: 0.66, fn: "s.bIn === 'position' && s.aIn === 'history' && s.abut === 0", label: 'B ends in the position and A, whole, in the history pocket'},
    {at: 1, fn: "s.phase === 'held' && s.bIn === 'position' && s.aIn === 'history' && s.reaching === 0 && s.thread === 1 && s.states === 1 && s.allReached && s.problems.length === 0", label: 'hold: B in the position, A kept in the history, thread and states shown; hands down; composition fits'},
    {at: 0.4, params: {textVisibility: 'none'}, fn: "s.phase === 'pushing' || s.phase === 'sliding'", label: 'labels hidden: the same slide'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.mode === 'pending' && s.bIn === 'rail' && s.abut === 0 && s.aIn === 'position' && s.reaching === 1 && s.ghost !== null && s.thread === 0", label: 'supplied state "pending": card B is slid up to card A and held there; A is not pushed; the dashed outline marks the position'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.bIn === 'rail' && s.states === 0", label: 'actionProgress freezes the action part-way (no state is captioned)'},
    {at: 0.1, fn: "s.phase === 'rest' && s.bIn === 'intake'", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.position, p.decisions.initial, p.decisions.later, p.grounds, p.routes.intake, p.routes.history, ...(p.finalState === 'pending' ? [p.pendingState] : [p.outcomes.position, p.outcomes.history]), p.labels.order, p.labels.key, p.actorLabels.a, p.objectLabels.calendar, p.objectLabels.holder];",
  content: "return [p.decisions.position, p.decisions.initial, p.decisions.later, p.routes.intake, p.routes.history, ...(p.finalState === 'pending' ? [p.pendingState] : [p.outcomes.position, p.outcomes.history])];",
  captions: 'return [p.objectLabels.calendar, p.objectLabels.holder, p.labels.order];',
});

ratioChecks(ID, 'cause before effect, cards only move when pushed, composition fits', [
  {at: times(0, 0.8, 0.005), fn: "!(s.phase === 'sliding' || s.phase === 'pushing') || s.reaching > 0.99", label: 'card B only moves while the hands are on it'},
  {at: times(0, 1, 0.005), fn: "s.aIn === 'position' || s.abut === 0", label: 'card A only moves while card B pushes it (they abut)'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
  {at: times(0.15, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
  {at: [1], fn: "s.mode === 'pending' ? (s.bIn === 'rail' && s.aIn === 'position' && s.abut === 0) : (s.bIn === 'position' && s.aIn === 'history')", label: 'the hold shows the supplied state'},
]);

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="rm-cardA"]', '[data-node="rm-cardB"]', '[data-node="rm-p0"]']});
noOverlapTest(ID, {markers: ['[data-node="rm-p0-head"]', '[data-node="rm-cardA"]', '[data-node="rm-cardB"]', '[data-node="rm-ghost"]', '[data-node="rm-thread"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^rm-p0$', floorFor: FLOOR_FOR});
headsClearTest(ID, {heads: '^rm-p0-head$', covers: ['[data-node="rm-cardA"]', '[data-node="rm-cardB"]', '[data-node="band"] text', '[data-node="actor-cap"] text']});
equalWeightTest(ID, {at: [0, 0.5, 1], marks: [['[data-node="rm-a-glyph-g"]', '[data-node="rm-b-glyph-g"]']], chips: [['[data-node="rm-a-text"]', '[data-node="rm-b-text"]']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.62, 0.7, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-table"]', min: 0.15});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
noTwinTextTest(ID);

// The two cards are drawn alike: same rendered size, stroke and opacity in every preset × ratio (equal weight), and
// neither is greyed, struck or dimmed at any time.
test(`${ID}: both cards keep the same size, stroke and full opacity throughout (every preset × ratio)`, async ({page}) => {
  test.setTimeout(400000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const u of [0, 0.3, 0.5, 0.7, 1]) {
      x.seek(u * x.durationMs);
      const A = node(svg, 'rm-a-body'), B = node(svg, 'rm-b-body');
      const a = box(A), b = box(B);
      if (Math.abs(a.w - b.w) > 0.5 || Math.abs(a.h - b.h) > 0.5) out.push(pr.name + ' ' + ratio + ' u=' + u + ': card sizes differ');
      if (A.getAttribute('stroke-width') !== B.getAttribute('stroke-width')) out.push(pr.name + ' ' + ratio + ': strokes differ');
      if (eff(svg, A) < 0.999 || eff(svg, B) < 0.999) out.push(pr.name + ' ' + ratio + ' u=' + u + ': a card is dimmed');
    }
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// The arms (sampled as discs) never lie over a visible text at any u, labels shown and hidden.
test(`${ID}: no arm of the participant covers a text at any u`, async ({page}) => {
  test.setTimeout(600000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (let u = 0; u <= 1.0001; u += 0.01) {
      x.seek(u * x.durationMs);
      const T = texts(svg, 0.3).map(box);
      for (const arm of ['armL', 'armR']) {
        const a = node(svg, 'rm-p0-' + arm + '-o');
        const ds = armDiscs(a);
        if (ds.some(d => T.some(b => discHits(d, b)))) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + arm + ' over a text');
      }
    }
    return [...new Set(out)].slice(0, 20);`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Shipped texts (defaults and presets, EN and ES) carry no verdict, rule, institution or time limit.
test(`${ID}: no supplied or default text carries a verdict, rule, institution or time limit`, async () => {
  const def = (await import(`../../src/animations/review/${ID}.js`)).default;
  const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
  const bad = [];
  const walk = (v, p) => { if (typeof v === 'string') { if (BANNED.test(v)) bad.push(`${p}: "${v}"`); } else if (v && typeof v === 'object') for (const [k, w] of Object.entries(v)) walk(w, `${p}.${k}`); };
  for (const pr of all) walk(pr.params, pr.name);
  for (const pr of presetsFor(ID).filter(q => q.name === 'baseline-es')) {
    const e = def.evaluate({params: pr.params, timeMs: def.defaultParams.durationMs});
    expect(e.semantic.problems).toEqual([]);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// The stress preset is at least as long as the baseline in every text field.
test(`${ID}: long-labels-stress is at least as long as the defaults in every text field`, async () => {
  const def = (await import(`../../src/animations/review/${ID}.js`)).default;
  const st = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  const bad = [];
  const walk = (a, b, p) => { if (typeof a === 'string') { if (typeof b === 'string' && b.length < a.length) bad.push(`${p}: ${b.length} < ${a.length}`); } else if (a && typeof a === 'object' && !Array.isArray(a)) for (const k of Object.keys(a)) if (b && k in b) walk(a[k], b[k], `${p}.${k}`); };
  walk(def.defaultParams, st, 'params');
  expect(bad, bad.join('\n')).toEqual([]);
});
