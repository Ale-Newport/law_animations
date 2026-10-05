// LAW-0327 — Ruta de recurso · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist (two complete rooms), exactly the supplied fact changes (the route state:
// "available, as supplied" in A, "not checked, as supplied" in B) and it changes objects and sequence, not only text or
// colour (A: the participant carries the sheet along the route to the last tray; B: the sheet stays in the first tray
// while its dashed outline — pending — traces the same route), and no legal consequence is invented.
// Timing (u): base 0–0.17 (identical) · state introduced 0.20–0.30 (base line out, solid / dashed in, sign ● / ◆) ·
// action 0.40–0.765 (A: hands 0.40–0.43, lift, carry 0.455–0.70, laid, let go, step back; B: the outline traces the route
// over the same carry window) · pins 0.76–0.80 · guide 0.78–0.85.
// Legal (VERY HIGH risk): abstract fictional bodies of the same size on one row in both rooms; the route is only the
// supplied sequence; "not checked" is a neutral pending state (dashed; never red, struck or "invalid"); no rank, appeal
// rule, admissibility, time limit, ground or outcome; neither state preferred. People floors (coordinator; review =
// hearings, FIGURE): >= 60 px off 1:1, >= 55 px at 1:1, long-labels-stress >= 45 px at every ratio.
// Rooms: side by side on wide frames (each >= 0.40 of the frame width at 16:9; at 1:1 two rooms side by side above a
// band, each ~0.48 of the width), stacked at 9:16 (each >= 0.80 of the width).
import {test, expect} from '@playwright/test';
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, textLinesVisibleTest, subjectFrameTest, linesOffTextTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, routeConsistencyTest, equalBodiesTest, routeAnchoredTest, routeOffTextTest, glyphStateTest, noTwinTextTest, gluedNumbersTest, noOneWordLineTest, ES_WORDS, FLOOR_FOR} from './ruta-recurso-checks.js';

const ID = 'LAW-0327';
const ROOMS = ['ra', 'rb'];

contractSuite(ID, {
  continuity: ['sheetA', 'sheetB', 'personA', 'personB', 'handA'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && s.docA === s.first && s.docB === s.first && s.stateA === 0 && s.signA === 0 && s.reachA === 0 && s.lookA === s.lookB", label: 'base: both rooms identical; the sheet in the first tray; no state shown'},
    {at: 0.15, fn: 's.lookA === s.lookB && s.stateA === 0', label: 'nothing differs before the change beat'},
    {at: 0.32, fn: 's.stateA === 1 && s.stateB === 1 && s.signA === 1 && s.signB === 1 && s.docA === s.first && s.docB === s.first && s.reachA === 0', label: 'introduce: each room shows its supplied state (solid ● / dashed ◆) at the same moment; nothing has moved yet'},
    {at: 0.43, fn: 's.reachA > 0.99 && s.reachB === 0 && s.docA === s.first', label: 'A: the hands reach the sheet before it moves; B: nobody takes it'},
    {at: 0.52, fn: 's.docA === -1 && s.docB === s.first && s.ghostB !== null', label: 'action: A carries the sheet along the route; B keeps it in the first tray while the outline traces the route'},
    {at: 1, fn: 's.docA === s.last && s.docB === s.first && s.ghostB === s.last && s.pin === 1 && s.guide === 1 && s.allReached && s.problems.length === 0', label: 'hold: A\'s sheet in the last tray, B\'s in the first with the outline in the last; pins; the guide; the composition fits'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 's.docA === -1 && s.docB === s.first && s.ghostB !== null', label: 'labels hidden: the same difference'},
    {at: 0.1, fn: 's.lookA === s.lookB && s.docA === s.first', label: 'seeking back restores the identical base'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [p.decisions.title, p.courier.label, ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b, p.scenarioA.label, p.scenarioB.label, p.labels.route, p.labels.sequence, p.labels.key, p.changedFact, ...p.sharedFacts, p.objectLabels.ghost, p.objectLabels.calendar, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  content: 'return [p.decisions.title, p.courier.label, ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b, p.changedFact];',
  captions: 'return [p.labels.sequence, p.objectLabels.ghost, p.objectLabels.calendar];',
});

ratioChecks(ID, 'equal pace in both rooms, cause before effect, composition fits', [
  {at: times(0, 1, 0.005), fn: 's.stepKA.every((q, j) => q === s.stepKB[j]) && s.stateA === s.stateB && s.signA === s.signB', label: 'A and B run over the same windows at every u'},
  {at: times(0, 0.8, 0.005), fn: 's.docA !== -1 || s.reachA > 0.99', label: 'A: off a tray the sheet is always in the hands'},
  {at: times(0, 1, 0.005), fn: 's.docB === s.first && s.reachB === 0', label: 'B: the sheet never leaves the first tray; nobody reaches for it'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

const PROPS = ['[data-node="ra-clock"]', '[data-node="ra-sign"]', '[data-node="rb-clock"]', '[data-node="rb-sign"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node="rb-ghost"]', '[data-node="ra-p0"]', '[data-node="rb-p0"]']});
// (the guide is checked along its stroke by linesOffTextTest: its bounding box spans both rooms)
noOverlapTest(ID, {markers: ['[data-node^="r"][data-node$="-p0-head"]', '[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node="rb-ghost"]', '[data-node="ra-sign"]', '[data-node="rb-sign"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^r[ab]-p0$', floorFor: FLOOR_FOR});
// (the dashed outline is drawn under the participant, so it never covers a head)
headsClearTest(ID, {heads: '^r[ab]-p0-head$', covers: ['[data-node="guide"]', '[data-node="ra-sign"]', '[data-node="rb-sign"]', '[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node^="r"][data-node*="-st"][data-node$="-plate"]', '[data-node^="hdr"]']});
armsClearTest(ID, {props: PROPS});
equalWeightTest(ID, {at: [0.35, 1], marks: [['[data-node="ra-sign-a-d-g"]', '[data-node="rb-sign-b-d-g"]'], ['[data-node="ra-doc-pin-a-g"]', '[data-node="rb-doc-pin-b-g"]'], ['[data-node="hdrA-cue"]', '[data-node="hdrB-cue"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
routeConsistencyTest(ID);
equalBodiesTest(ID, {rooms: ROOMS});
routeAnchoredTest(ID, {rooms: ROOMS});
routeOffTextTest(ID, {rooms: ROOMS});
glyphStateTest(ID, {prefixes: ROOMS});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.25, 0.35, 0.5, 0.65, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="ra-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
textLinesVisibleTest(ID);
linesOffTextTest(ID, {lines: ['[data-node="guide"]']});
gluedNumbersTest(ID);
noOneWordLineTest(ID);

// The one changed fact alters objects and sequence, large inside the scenes (rendered, every preset × ratio × labels):
// before u = 0.17 both rooms render identically (sheet, participant, route line style, sign); at the hold A's sheet lies
// in the last tray and B's in the first, B's dashed outline lies in the last tray; A's route lines are solid and B's
// dashed; the signs show ● in A and ◆ in B, each sign >= 3 % of the frame width.
test(`${ID}: the changed fact moves real objects — the sheet ends in different trays; route style and sign follow the state`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const F = svg.getBoundingClientRect();
    const rel = (P, n) => { const W0 = box(node(svg, P + '-walls')); const b = box(node(svg, P + '-' + n)); return [Math.round((b.l - W0.l) * 10) / 10, Math.round((b.t - W0.t) * 10) / 10]; };
    for (const u of [0, 0.08, 0.16]) {
      x.seek(u * x.durationMs);
      for (const n of ['doc', 'p0']) if (JSON.stringify(rel('ra', n)) !== JSON.stringify(rel('rb', n))) out.push(tag + ' u=' + u + ': ' + n + ' differs before the change');
      const op = (P) => [...nodes(svg, new RegExp('^' + P + '-r[tdb]\\\\d+$'))].map(e => Math.round(eff(svg, e) * 100)).join();
      if (op('ra') !== op('rb')) out.push(tag + ' u=' + u + ': route styles differ before the change');
    }
    x.seek(x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    if (s.docA !== s.last || s.docB !== s.first || s.ghostB !== s.last) out.push(tag + ': sheets at ' + s.docA + ' / ' + s.docB + ', outline at ' + s.ghostB);
    const solidA = nodes(svg, /^ra-rt\\d+$/).every(e => eff(svg, e) > 0.95), dashedB = nodes(svg, /^rb-rd\\d+$/).every(e => eff(svg, e) > 0.95);
    const noDashA = nodes(svg, /^ra-rd\\d+$/).every(e => eff(svg, e) < 0.05), noSolidB = nodes(svg, /^rb-rt\\d+$/).every(e => eff(svg, e) < 0.05);
    if (!(solidA && dashedB && noDashA && noSolidB)) out.push(tag + ': route styles at the hold do not follow the states');
    for (const [P, sd] of [['ra', 'a'], ['rb', 'b']]) {
      const sg = node(svg, P + '-sign-' + sd);
      if (!sg || eff(svg, sg) < 0.95) { out.push(tag + ': ' + P + ' sign ' + sd + ' not shown'); continue; }
      const w0 = box(node(svg, P + '-sign-body')).w / F.width;
      stat('sign width share ' + ratio, Math.round(w0 * 1000) / 1000);
      if (w0 < 0.03) out.push(tag + ': ' + P + ' sign ' + w0.toFixed(3) + ' of the frame width');
    }
    return out;`, {}, {withHidden: true});
  report(ID, 'changed fact', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 18 and the contrast layout: side by side at 16:9 (each room >= 0.40 of the frame width) and at 1:1 (each >= 0.40;
// with labels hidden 1:1 may stack the rooms full width instead), stacked at 9:16 (each >= 0.80 of the width, B below
// A); the rooms never overlap.
test(`${ID}: two complete rooms — side by side on wide and square frames (>= 0.40 W each), stacked on tall ones (>= 0.80 W)`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    const A = box(node(svg, 'ra-walls')), B = box(node(svg, 'rb-walls'));
    const wa = A.w / F.width, wb = B.w / F.width;
    stat('room width share ' + ratio, Math.round(Math.min(wa, wb) * 1000) / 1000);
    if (hit(A, B, 0)) out.push(pr.name + ' ' + ratio + ': the rooms overlap');
    const stacked = B.t >= A.b - 1;
    if (ratio === '9:16' || (ratio === '1:1' && stacked)) { if (!(B.t >= A.b - 1) || Math.min(wa, wb) < 0.8) out.push(pr.name + ' ' + ratio + ': not stacked full width (' + wa.toFixed(2) + ')'); }
    else if (!(B.l >= A.r - 1) || Math.min(wa, wb) < 0.4) out.push(pr.name + ' ' + ratio + ': not side by side >= 0.40 W (' + wa.toFixed(3) + ')');
    return out;`, {}, {withHidden: true});
  report(ID, 'rooms', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The guide links the changed detail: drawn at the hold, it starts on sign A's top edge and ends on sign B's top edge.
test(`${ID}: the guide runs from sign A to sign B (rendered ends on both signs)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const gd = node(svg, 'guide');
    if (eff(svg, gd) < 0.95) return [pr.name + ' ' + ratio + ': no guide'];
    const m = gd.getScreenCTM(); const L = gd.getTotalLength();
    const p0 = new DOMPoint(gd.getPointAtLength(0).x, gd.getPointAtLength(0).y).matrixTransform(m), p1 = new DOMPoint(gd.getPointAtLength(L).x, gd.getPointAtLength(L).y).matrixTransform(m);
    const A = box(node(svg, 'ra-sign-body')), B = box(node(svg, 'rb-sign-body'));
    if (p0.x < A.l || p0.x > A.r || Math.abs(p0.y - A.t) > 3) out.push(pr.name + ' ' + ratio + ': the guide does not start on sign A');
    if (p1.x < B.l || p1.x > B.r || Math.abs(p1.y - B.t) > 3) out.push(pr.name + ' ' + ratio + ': the guide does not end on sign B');
    return out;`, {}, {withHidden: false});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Nothing teleports (rendered, 60 fps): sheets, outline and participants move < 40 px per frame; A's hand holds the
// sheet's lower edge whenever it is lifted; A's sheet and B's outline visit the trays of the supplied route in order.
test(`${ID}: continuous motion; A's sheet only in the hands; both visit the route's trays in the supplied order`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    let prev = null, worst = 0;
    const vA = [], vB = [];
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      const now = [s.sheetA, s.sheetB, s.personA, s.personB, s.outlineB || s.sheetB];
      if (prev) now.forEach((q, i) => { worst = Math.max(worst, Math.hypot(q.x - prev[i].x, q.y - prev[i].y) * s.pxu); });
      prev = now;
      if (s.docA >= 0 && vA[vA.length - 1] !== s.docA) vA.push(s.docA);
      if (s.ghostB !== null && s.ghostB >= 0 && vB[vB.length - 1] !== s.ghostB) vB.push(s.ghostB);
    }
    const s1 = x.getState({bounds: false}).semantic;
    stat('max move px/frame ' + ratio, Math.round(worst), 'max');
    if (worst > 40) out.push(tag + ': something jumps ' + Math.round(worst) + ' px in one frame');
    if (vA.join('>') !== s1.steps.join('>')) out.push(tag + ': A visits ' + vA.join('>'));
    if (vB.join('>') !== s1.steps.join('>')) out.push(tag + ': B\\'s outline visits ' + vB.join('>'));
    return out;`, {}, {withHidden: true});
  report(ID, 'continuity', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});
