// LAW-0305 — Declaración experta en audiencia · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the specialist's pointing hand is the solved
// hand; the chart travels from its exhibit along the lane to its place and grows to a sheet, its reference tag with it;
// the explanation card comes out of the specialist's raised hand; the connector runs from the marked span to the card)
// and the transformation (the chart connected to the explanation on the board) recognisable with labels hidden.
// Timing (u): rest 0–0.16 · the specialist points 0.16–0.216 · the chart travels 0.216–0.384 · its tag 0.384–0.423 ·
// the span band 0.434–0.479 · the hand rises again 0.479–0.507 · the card comes out 0.507–0.608 · the connector
// 0.614–0.664 · its caption 0.664–0.709 · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal: ● measurement / ◆ the specialist's interpretation are supplied states of equal weight; the chart's data are
// fictional and generic; the span is only a supplied span; the interpretation is neither right nor wrong; no
// expert-evidence rule, weight, reliability, credibility, acceptance or outcome; jurisdiction unspecified.
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, chartConsistencyTest, glyphStateTest, noTwinTextTest, ES_WORDS, FLOOR_FOR} from './declaracion-experta-checks.js';

const ID = 'LAW-0305';

contractSuite(ID, {
  continuity: ['chart', 'hand'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.chartState === 'cabinet' && s.tag === 0 && s.span === 0 && s.card === 0 && s.link === 0 && s.pointing === 0", label: 'rest: the chart lies on its exhibit; the board is empty; nobody points'},
    {at: 0.155, fn: "s.chartState === 'cabinet' && s.pointing === 0", label: 'nothing moves during the rest beat'},
    {at: 0.21, fn: "s.pointing > 0.9 && s.chartState === 'cabinet'", label: 'the specialist points to the board before the chart moves (cause before effect)'},
    {at: 0.3, fn: "s.chartState === 'travelling' && s.tag === 0", label: 'the chart travels along the lane to its place'},
    {at: 0.42, fn: "s.chartState === 'placed' && s.chartScale === 1 && s.tag > 0 && s.span === 0", label: 'the chart has settled and its reference tag arrives; no span is marked yet'},
    {at: 0.48, fn: "s.span === 1 && s.card === 0", label: 'the span is marked before the specialist explains'},
    {at: 0.56, fn: "s.explanationState === 'explaining' && s.gesture > 0.5 && s.link === 0", label: 'the explanation card comes out of the specialist\'s raised hand; no connector yet'},
    {at: 0.64, fn: "s.explanationState === 'connecting' && s.card === 1 && s.caption === 0", label: 'the connector draws from the span to the card once the card has arrived'},
    {at: 1, fn: "s.chartState === 'placed' && s.tag === 1 && s.span === 1 && s.card === 1 && s.link === 1 && s.explanationState === 'connected' && s.caption === 1 && s.finalState === 'interpretation-connected' && s.allReached && s.problems.length === 0 && s.pointing === 0", label: 'hold: the chart with its reference connected to the explanation with its caption; the composition fits'},
    {at: 0.56, params: {textVisibility: 'none'}, fn: "s.explanationState === 'explaining' && s.chartState === 'placed'", label: 'labels hidden: the same travel, explanation and connection happen'},
    {at: 1, params: {finalState: 'measurement-only'}, fn: "s.chartState === 'placed' && s.explanationState === 'none' && s.span === 0 && s.link === 0", label: 'supplied final state: the chart only, no explanation connected'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.explanationState === 'none'", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sequence: [1, 0]}, fn: "s.order === '1>0' && s.boardLeft === 'detail' && s.cardAt.x < s.sheet.x", label: 'the supplied sequence decides the order of the places on the board'},
    {at: 0.1, fn: "s.chartState === 'cabinet' && s.tag === 0 && s.card === 0 && s.link === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const det = p.finalState !== 'measurement-only'; return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'measurement' || det).map(s => s.text), ...p.exhibits, p.states.measurement, ...(det ? [p.states.interpretation, p.labels.span] : []), p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.cabinet, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'measurement' || p.finalState !== 'measurement-only').map(s => s.text), ...p.exhibits];",
  captions: 'return [p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.cabinet, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, one thing moving at a time, composition fits', [
  {at: times(0.16, 0.74, 0.005), fn: "s.chartState === 'cabinet' || s.pointing > 0 || s.tag > 0", label: 'the chart only moves once the specialist has pointed'},
  {at: times(0.16, 0.74, 0.005), fn: "!(s.chartState === 'travelling' && (s.span > 0 || s.card > 0))", label: 'one thing at a time: nothing is marked or explained while the chart travels'},
  {at: times(0.16, 0.74, 0.005), fn: 's.card === 0 || s.span === 1', label: 'the card only comes out once the span is marked'},
  {at: times(0.16, 0.74, 0.005), fn: 's.card === 0 || s.gesture > 0 || s.card === 1', label: 'the card comes out while the specialist\'s hand is raised'},
  {at: times(0.16, 0.74, 0.005), fn: 's.link === 0 || s.card === 1', label: 'the connector only draws once the card has arrived'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.16, 0.74, 0.01), fn: 's.allReached', label: 'the pointing hand stays within the arm'},
]);

// (the board's own parts; the explanation card is exempt: it comes out of the specialist's raised hand)
const PROPS = ['[data-node="rm-board-body"]', '[data-node="rm-page-place"]', '[data-node="rm-zone-place"]', '[data-node="rm-cap"]', '[data-node="rm-tag"]', '[data-node="rm-doc"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node="rm-doc"]', '[data-node^="rm-p"][data-node$="-head"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node="rm-doc"]', '[data-node="rm-board"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 72});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-interpretation"] path:first-of-type', '[data-node="lg-measurement"] circle'], ['[data-node="rm-capplate-g"]', '[data-node="rm-tagplate-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
chartConsistencyTest(ID);
glyphStateTest(ID, {at: [0.5, 1]});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.55, 0.62, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="lab"][data-node$="-lead"]', '[data-node="rm-tethers"]']});
textLinesVisibleTest(ID);

// The action is recognisable with the labels hidden: the chart on the board, its marked span, the explanation card
// in its place (it started at the specialist's hand) and the connector between them; the exhibit place on the cabinet.
test(`${ID}: labels hidden — the chart settles on the board and its marked span is connected to the specialist's card`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none'}});
    await x.ready;
    const svg = x.element;
    const op = e => { if (!e) return 0; let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
    const q = sel => svg.querySelector(sel);
    const ctr = e => { const b = e.getBoundingClientRect(); return {x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width}; };
    x.seek(0.1 * x.durationMs); const at0 = q('[data-node="rm-doc"]').getBoundingClientRect();
    const head = ctr(q('[data-node="rm-p0-head"]'));
    x.seek(0.515 * x.durationMs); const c0 = ctr(q('[data-node="rm-zcopy-main"]'));
    x.seek(x.durationMs);
    const at1 = q('[data-node="rm-doc"]').getBoundingClientRect();
    const c1 = ctr(q('[data-node="rm-zcopy-main"]'));
    return {moved: Math.hypot(at1.x - at0.x, at1.y - at0.y), grew: at1.width / at0.width, span: op(q('[data-node="rm-frame-main"]')), card: op(q('[data-node="rm-zcopy-main"]')), tethers: op(q('[data-node="rm-tethers"]')), cardFromHand: Math.hypot(c0.x - head.x, c0.y - head.y), cardMoved: Math.hypot(c1.x - c0.x, c1.y - c0.y), cardGrew: c1.w / c0.w, text: [...svg.querySelectorAll('[data-node="rm-tag"] text, [data-node="rm-cap"] text')].length};
  }, ID);
  expect(out.moved).toBeGreaterThan(40);
  expect(out.grew).toBeGreaterThan(1.8);
  expect(out.span).toBeGreaterThan(0.95);
  expect(out.card).toBeGreaterThan(0.95);
  expect(out.tethers).toBeGreaterThan(0.95);
  expect(out.cardMoved).toBeGreaterThan(out.cardFromHand);
  expect(out.cardGrew).toBeGreaterThan(2.5);
  expect(out.text).toBe(0);
});

void presetsFor;
