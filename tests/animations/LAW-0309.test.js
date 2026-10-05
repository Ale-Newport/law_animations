// LAW-0309 — Pausa de audiencia · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the operator's signalling hand is the solved
// hand; the recess card comes out of the operator's raised hand; the connector runs from the session clock's bezel to
// the card's dial) and the transformation (the session clock stopped with its pause badge, the recess card in place, the
// positions marked) recognisable with labels hidden.
// Timing (u): rest 0–0.16 (session clock running) · the operator signals 0.16–0.216 · the session clock slows down and
// stops 0.216–0.362 · pause badge 0.362–0.406 · the hand rises again 0.418–0.446 · the card comes out 0.446–0.552 · the
// connector 0.558–0.602 · its caption 0.602–0.647 · floor rings (kept positions) 0.653–0.709 · notes 0.75–0.80 · state
// tag 0.76–0.81; still from 0.81 (the wall clock keeps running: the paused clock never reads as broken).
// Legal: ● session active / ◆ recess are supplied states of equal weight; the times are fictional and labelled as
// supplied; no rule on recesses, no duration, time limit, consequence or end of the proceedings; jurisdiction unspecified.
// People floors (coordinator; hearings measure the FIGURE height): >= 60 px off 1:1; >= 55 px at 1:1 except
// long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, pauseConsistencyTest, glyphStateTest, noTwinTextTest, positionsKeptTest, glyphFollowsStateTest, ES_WORDS, FLOOR_FOR} from './pausa-audiencia-checks.js';

const ID = 'LAW-0309';

contractSuite(ID, {
  continuity: ['hand'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.clockState === 'running' && s.pause === 0 && s.card === 0 && s.link === 0 && s.pins === 0 && s.signalling === 0", label: 'rest: the session clock runs; nothing else happens; nobody signals'},
    {at: 0.155, fn: "s.clockState === 'running' && s.signalling === 0 && s.run > 0", label: 'the session clock runs during the rest beat'},
    {at: 0.21, fn: "s.signalling > 0.9 && s.clockState === 'running'", label: 'the operator signals towards the panel before the clock slows (cause before effect)'},
    {at: 0.3, fn: "s.clockState === 'slowing' && s.pause === 0 && s.card === 0", label: 'the session clock slows down towards the supplied time'},
    {at: 0.41, fn: "s.clockState === 'stopped' && s.run === 1 && s.pause === 1 && s.card === 0", label: 'the session clock has stopped at the supplied time and carries the pause badge; no card yet'},
    {at: 0.5, fn: "s.cardState === 'coming' && s.gesture > 0.5 && s.link === 0", label: 'the recess card comes out of the operator\'s raised hand; no connector yet'},
    {at: 0.58, fn: "s.cardState === 'connecting' && s.card === 1 && s.caption === 0", label: 'the connector draws from the session clock to the card once the card has arrived'},
    {at: 0.68, fn: "s.caption === 1 && s.pins > 0 && s.pins < 1", label: 'the caption has arrived; the floor rings mark the kept positions'},
    {at: 1, fn: "s.clockState === 'stopped' && s.pause === 1 && s.card === 1 && s.link === 1 && s.cardState === 'connected' && s.caption === 1 && s.pins === 1 && s.finalState === 'recess' && s.allReached && s.problems.length === 0 && s.signalling === 0", label: 'hold: the paused session clock and the connected recess card with its caption; positions marked; the composition fits'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.cardState === 'coming' && s.clockState === 'stopped'", label: 'labels hidden: the same stop, card and connection happen'},
    {at: 1, params: {finalState: 'session-active'}, fn: "s.clockState === 'running' && s.cardState === 'none' && s.pause === 0 && s.pins === 0 && s.run > 1", label: 'supplied final state: the session stays active, its clock keeps running'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.cardState === 'none'", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sequence: [1, 0]}, fn: "s.order === '1>0' && s.boardLeft === 'detail' && s.cardAt.x < s.clockAt.x", label: 'the supplied sequence decides the order of the places on the panel'},
    {at: 0.1, fn: "s.clockState === 'running' && s.pause === 0 && s.card === 0 && s.pins === 0", label: 'seeking back restores the running clock exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const det = p.finalState !== 'session-active'; return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'active' || det).map(s => s.text), ...p.exhibits, p.states.active, ...(det ? [p.states.recess, p.labels.positions] : []), p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.cabinet, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'active' || p.finalState !== 'session-active').map(s => s.text), ...p.exhibits];",
  captions: 'return [p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.cabinet, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, one thing at a time, positions kept, composition fits', [
  {at: times(0.16, 0.74, 0.005), fn: "s.clockState === 'running' && s.run < 0.999 || s.signalling > 0 || s.clockState === 'stopped'", label: 'the clock only slows once the operator has signalled'},
  {at: times(0.16, 0.74, 0.005), fn: "!(s.clockState === 'slowing' && (s.card > 0 || s.pause > 0))", label: 'one thing at a time: no badge or card while the clock slows'},
  {at: times(0.16, 0.74, 0.005), fn: 's.card === 0 || s.pause === 1', label: 'the card only comes out once the clock is paused'},
  {at: times(0.16, 0.74, 0.005), fn: 's.card === 0 || s.gesture > 0 || s.card === 1', label: 'the card comes out while the operator\'s hand is raised'},
  {at: times(0.16, 0.74, 0.005), fn: 's.link === 0 || s.card === 1', label: 'the connector only draws once the card has arrived'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.16, 0.74, 0.01), fn: 's.allReached', label: 'the signalling hand stays within the arm'},
]);

const PROPS = ['[data-node="rm-board-body"]', '[data-node="rm-zone-place"]', '[data-node="rm-cap"]', '[data-node="rm-tag"]', '[data-node="rm-sclock"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node="rm-sclock"]', '[data-node^="rm-p"][data-node$="-head"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node="rm-board"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 72});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-recess"] path:first-of-type', '[data-node="lg-active"] circle'], ['[data-node="rm-capplate-g"]', '[data-node="rm-tagplate-g2"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
pauseConsistencyTest(ID);
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
positionsKeptTest(ID, {pausedFrom: 0.37});

// The action is recognisable with the labels hidden: the session clock's minute hand turned and then stands still with
// the pause badge, the recess card in its place (it started at the operator's hand), the connector between them and the
// floor rings round every participant.
test(`${ID}: labels hidden — the session clock stops with its badge, the recess card arrives from the operator's hand, the positions are marked`, async ({page}) => {
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
    const ang = e => parseFloat(/rotate\(([-\d.]+)/.exec(e.getAttribute('transform'))[1]);
    const ctr = e => { const b = e.getBoundingClientRect(); return {x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width}; };
    x.seek(0); const a0 = ang(q('[data-node="rm-sclock-min"]'));
    const head = ctr(q('[data-node="rm-p0-head"]'));
    x.seek(0.45 * x.durationMs); const a1 = ang(q('[data-node="rm-sclock-min"]'));
    x.seek(0.46 * x.durationMs); const c0 = ctr(q('[data-node="rm-zcopy-main"]'));
    x.seek(x.durationMs);
    const a2 = ang(q('[data-node="rm-sclock-min"]'));
    const c1 = ctr(q('[data-node="rm-zcopy-main"]'));
    const pins = [...svg.querySelectorAll('[data-node^="rm-pin"]')].map(op);
    return {turned: a1 - a0, still: Math.abs(a2 - a1), badge: op(q('[data-node="rm-pause"]')), card: op(q('[data-node="rm-zcopy-main"]')), tethers: op(q('[data-node="rm-tethers"]')), cardFromHand: Math.hypot(c0.x - head.x, c0.y - head.y), cardMoved: Math.hypot(c1.x - c0.x, c1.y - c0.y), cardGrew: c1.w / c0.w, pins, text: [...svg.querySelectorAll('[data-node="rm-tag"] text, [data-node="rm-cap"] text')].length};
  }, ID);
  expect(out.turned).toBeGreaterThan(30);
  expect(out.still).toBeLessThan(0.01);
  expect(out.badge).toBeGreaterThan(0.95);
  expect(out.card).toBeGreaterThan(0.95);
  expect(out.tethers).toBeGreaterThan(0.95);
  expect(out.cardMoved).toBeGreaterThan(out.cardFromHand);
  expect(out.cardGrew).toBeGreaterThan(2.5);
  expect(out.pins.length).toBe(3);
  expect(Math.min(...out.pins)).toBeGreaterThan(0.95);
  expect(out.text).toBe(0);
});

void presetsFor;
glyphFollowsStateTest(ID);
