// LAW-0283 — Apertura de audiencia · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist (two complete, identical rooms), exactly the indicated fact changes (the
// supplied session state: A started, B pending — switch position, display state and, as its dependent effect, A's lamps;
// the same hand-over runs in both), and no legal consequence is invented (pending is only a waiting state; no winner,
// score or outcome; no red; dashes only on B's pending display frame; no arrows).
// Timing (u): base 0–0.17 (A and B identical) · switches 0.18–0.22 · displays 0.22–0.26 · changed fact 0.20–0.25 · A pulse
// 0.24–0.32 · A lamps 0.27–0.36 · cards in both rooms 0.40–0.75 · guide 0.77–0.84 (row 0.79–0.83); still from 0.84.
// People floors (production/SESSION_HANDOFF.md, STANDING PEOPLE FLOORS): >= 60 px; 1:1 contrast >= 55 px in the
// baselines and >= 45 px in the other presets.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, limbsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';

const ID = 'LAW-0283';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && s.stateA === 'blank' && s.stateB === 'blank' && s.switchA === s.switchB && s.lightsA === 0 && s.cardState.every(c => c === 'in-tray')", label: 'base: two identical rooms at rest (blank displays, switches in the middle, lights off, cards in the trays)'},
    {at: 0.16, fn: 's.lookA === s.lookB', label: 'nothing differs before the change beat'},
    {at: 0.3, fn: "s.stateA === 'started' && s.stateB === 'pending' && s.switchA === 1 && s.switchB === 0", label: 'the one supplied fact is introduced in both rooms at once: A started (switch ●), B pending (switch ◆)'},
    {at: 0.4, fn: 's.lightsA === 1 && s.lightsB === 0', label: 'only A is activated (its lamps come on); B waits'},
    {at: 0.6, fn: "s.received >= 1 && s.cardState.some(c => c !== 'placed')", label: 'the same hand-over runs in parallel in both rooms'},
    {at: 0.77, fn: "s.cardState.every(c => c === 'placed') && s.guide === 0", label: 'the hand-over is complete before the guide'},
    {at: 1, fn: "s.guide === 1 && s.stateA === 'started' && s.stateB === 'pending' && s.allReached && s.problems.length === 0", label: 'hold: the guide links the two displays; the composition fits'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.lightsA === 1 && s.switchA === 1 && s.switchB === 0', label: 'labels hidden: the difference still reads (switch, lamps, frames)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.order === '2>0>3>1' && s.problems.length === 0", label: 'another supplied configuration (sequence C, A, D, B)'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.speaker < p.speakers.length).map(s => s.text), ...p.exhibits, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.sequence, p.labels.key];',
  content: 'return [...p.speakers.map(s => s.label), p.scenarioA.label, p.scenarioB.label, p.changedFact];',
  captions: 'return [p.labels.sequence, p.comparisonLabels.guide];',
});

ratioChecks(ID, 'A and B identical before the beat, the same action in both, the difference introduced together', [
  {at: times(0, 0.17, 0.01), fn: 's.lookA === s.lookB', label: 'A and B identical before the change beat'},
  {at: times(0.17, 1, 0.02), fn: "s.stateA !== 'blank' || s.stateB === 'blank'", label: 'the two states arrive together (never one before the other)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits (badges placed, people above the floor)'},
]);

// The guide: starts on display A, ends on display B, runs through free channels (crosses no text, head or person and
// never retraces itself).
test(`${ID}: the guide links the two displays through free channels (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const gd = node(svg, 'guide');
    if (!gd || eff(svg, gd) < 0.9) { out.push(tag + ': guide not shown at the hold'); return out; }
    const m = gd.getScreenCTM();
    const L = gd.getTotalLength();
    const P = t => new DOMPoint(gd.getPointAtLength(t).x, gd.getPointAtLength(t).y).matrixTransform(m);
    const A = P(0), B = P(L);
    const near = (q, b) => q.x >= b.l - 4 && q.x <= b.r + 4 && q.y >= b.t - 4 && q.y <= b.b + 4;
    const unitA = box(node(svg, 'ra-unit')), unitB = box(node(svg, 'rb-unit'));
    if (!near(A, unitA)) out.push(tag + ': the guide does not start on display A');
    if (!near(B, unitB)) out.push(tag + ': the guide does not end on display B');
    const T = texts(svg, 0.3).map(box);
    const heads = nodes(svg, /^r[ab]-p\\d-head$/).map(box);
    const bodies = nodes(svg, /^r[ab]-p\\d$/).map(box);
    let crossings = 0;
    for (let t = 8; t < L - 8; t += 3) {
      const q = P(t);
      if (T.some(b => q.x > b.l - 2 && q.x < b.r + 2 && q.y > b.t - 2 && q.y < b.b + 2)) { out.push(tag + ': the guide crosses a text'); break; }
      if (heads.some(b => q.x > b.l && q.x < b.r && q.y > b.t && q.y < b.b)) { out.push(tag + ': the guide crosses a head'); break; }
      if (bodies.some(b => q.x > b.l && q.x < b.r && q.y > b.t && q.y < b.b)) crossings++;
    }
    if (crossings) out.push(tag + ': the guide crosses a person');
    // no retracing: the points are visited once (no point of the path lies on an earlier part of it, 6 px apart)
    const pts = [];
    for (let t = 0; t <= L; t += 4) pts.push(P(t));
    for (let i = 0; i < pts.length && !out.some(o => o.includes('retrac')); i++) for (let j = i + 4; j < pts.length; j++) if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < 2) { out.push(tag + ': the guide retraces itself'); break; }
    stat('guide length px ' + ratio, Math.round(L * Math.hypot(m.a, m.b)));
    return out;`, {});
  report(ID, 'guide', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Number badges belong to their participant: nearer their own person than any other, beside (not over) them, off the
// table, the same in A and B.
test(`${ID}: number badges sit beside their own participant (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const k = px1080(svg, w, h);
    for (const room of ['A', 'B']) {
      const people = nodes(svg, new RegExp('^r' + room.toLowerCase() + '-p\\\\d$')).map(e => { const mm = e.getScreenCTM(); return {n: e.getAttribute('data-node'), x: mm.e, y: mm.f, r: 50 * Math.hypot(mm.a, mm.b), hc: headCircle(e.querySelector('[data-node$="-head"]'))}; });
      for (const b of nodes(svg, new RegExp('^b' + room + '\\\\d$'))) {
        const i = +b.getAttribute('data-node').slice(2);
        const c = b.querySelector('circle');
        const bb = box(c);
        const cx = (bb.l + bb.r) / 2, cy = (bb.t + bb.b) / 2;
        const own = people.find(q => q.n === 'r' + room.toLowerCase() + '-p' + i);
        const d0 = Math.hypot(cx - own.x, cy - own.y);
        const gap = (d0 - own.r - bb.w / 2) / k;
        stat('badge gap px ' + ratio, Math.round(gap), 'max');
        if (gap > 40) out.push(tag + ': badge ' + room + i + ' is ' + Math.round(gap) + ' px from its participant');
        for (const q of people) if (q !== own && Math.hypot(cx - q.x, cy - q.y) <= d0) out.push(tag + ': badge ' + room + i + ' is nearer ' + q.n);
        for (const q of people) if (Math.hypot(cx - q.hc.x, cy - q.hc.y) < q.hc.r + bb.w / 2) out.push(tag + ': badge ' + room + i + ' over the head of ' + q.n);
      }
    }
    return out;`, {});
  report(ID, 'badges', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

const PROPS = ['[data-node^="ra-sheet"]', '[data-node^="rb-sheet"]', '[data-node^="ra-card"]', '[data-node^="rb-card"]', '[data-node^="ra-exhibit"]', '[data-node^="rb-exhibit"]', '[data-node="ra-tray"]', '[data-node="rb-tray"]', '[data-node="ra-display"]', '[data-node="rb-display"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node^="bA"]', '[data-node^="bB"]', '[data-node^="hdr"]']});
noOverlapTest(ID, {markers: ['[data-node^="bA"]', '[data-node^="bB"]', '[data-node^="hdr"]', '[data-node^="ra-card"]', '[data-node^="rb-card"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^r[ab]-p\\d$', floorFor: "return ratio === '1:1' ? (['default', 'baseline-illustrative', 'baseline-es'].includes(preset.replace(' (labels hidden)', '')) ? 55 : 45) : 60;"});
headsClearTest(ID, {heads: '^r[ab]-p\\d-head$', covers: ['[data-node^="bA"]', '[data-node^="bB"]', '[data-node^="hdr"]', '[data-node="guide"]', '[data-node^="ra-card"]', '[data-node^="rb-card"]']});
limbsClearTest(ID, {people: '^r[ab]-p(\\d)$', props: PROPS});
equalWeightTest(ID, {chips: [['[data-node="hdrA"]', '[data-node="hdrB"]'], ['[data-node="bA0"]', '[data-node="bB0"]']], marks: [['[data-node="rb-d-pending"] path', '[data-node="ra-d-started"] circle']], at: [0.1, 0.5, 1]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.5, 0.8, 1]});
fillMostTest(ID, {subject: '[data-node="ra-room"]', subjectMin: 0.2});
thinContentTest(ID);
esDefaultsTest(ID);
