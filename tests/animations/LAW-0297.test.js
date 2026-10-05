// LAW-0297 — Objeción procesal · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the question slip rides in the SOLVED hand of
// the questioner until it is set on the tray; the signal paddle is held in the raiser's solved hand; each supplied card
// travels from its giver to its place on the rail and opens there) and the transformation (the question paused, the
// reason card — and the response card when supplied — on the rail) recognisable with labels hidden.
// Timing (u): rest 0–0.16 · the question lifted, carried and set 0.16–0.264 · it slides up the guide 0.264– · the signal
// rises 0.241–0.271 and the question pauses at 0.276 · the reason card travels 0.296–0.402 and opens 0.402–0.476 · the
// response card travels 0.53–0.626 and opens 0.626–0.70 · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal content: ● intervention raised / ◆ response as supplied are supplied states of equal weight; the response card
// is only a supplied card with editable neutral text; the question stays paused (no grounds, ruling, outcome, winner or
// hierarchy; the two seated participants sit at the same table on the same chairs).
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {rulingFreeDataTest, rulingFreeRenderTest, stressLongerTest, objectionConsistencyTest, noHierarchyTest, ES_WORDS, FLOOR_FOR} from './objecion-procesal-checks.js';

const ID = 'LAW-0297';

contractSuite(ID, {
  continuity: ['handQ', 'handW', 'handL', 'questioner'],
  // while the question slip is carried it rides in the questioner's solved hand
  attach: [{from: 0.236, to: 0.254, a: 'hand', b: 'heldSlip', tol: 0.6}],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.itemState[s.qI] === 'stack' && s.itemState[s.intI] === 'none' && s.itemState[s.resI] === 'none' && s.onRail === 0 && s.signal === 0 && s.paused === 0", label: 'rest: the question slip with the questioner, nothing on the rail, no signal'},
    {at: 0.155, fn: "s.itemState[s.qI] === 'stack' && s.questionerDeg === 180 && s.signal === 0", label: 'nothing moves during the rest beat'},
    {at: 0.245, fn: "s.carrier === s.roles.questioner && s.held === s.qI", label: 'the questioner carries the question slip to the tray'},
    {at: 0.268, fn: "s.itemState[s.qI] === 'sliding' && s.signal > 0 && s.paused === 0", label: 'the signal is rising while the question slides up the guide'},
    {at: 0.29, fn: "s.paused === 1 && s.signal === 1 && s.itemState[s.qI] === 'paused' && s.signalHand !== null && s.itemState[s.intI] === 'none'", label: 'the signal is up and the question pauses (cause before effect)'},
    {at: 0.35, fn: "s.itemState[s.intI] === 'travelling' && s['slip' + s.intI] !== null && s.itemState[s.resI] === 'none'", label: 'the reason card travels to the rail'},
    {at: 0.5, fn: "s.itemState[s.intI] === 'open' && s.textShown[s.intI] === 1 && s.itemState[s.resI] === 'none' && s.signal === 0", label: 'the reason card is open on the rail; the paddle is lowered'},
    {at: 0.58, fn: "s.itemState[s.resI] === 'travelling'", label: 'the response card travels to the rail'},
    ...[0.42, 0.45, 0.65].map(at => ({at, fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: `a card's text only arrives once it is open (u=${at})`})),
    {at: 1, fn: "s.itemState[s.qI] === 'paused' && s.open[s.qI] === 0 && s.itemState[s.intI] === 'open' && s.itemState[s.resI] === 'open' && s.finalState === 'response-supplied' && s.allReached && s.routesClear && s.problems.length === 0 && s.order === '1>2>0'", label: 'hold: the question still paused; the reason and response cards on the rail in the configured sequence; the composition fits'},
    {at: 0.35, params: {textVisibility: 'none'}, fn: "s.paused === 1 && s.itemState[s.intI] === 'travelling'", label: 'labels hidden: the same pause and travel happen'},
    {at: 1, params: {finalState: 'intervention-only'}, fn: "s.itemState[s.resI] === 'none' && s.itemState[s.intI] === 'open' && s.paused === 1", label: 'supplied final state: only the reason card, the question still paused'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.itemState[s.resI] === 'none' && s.itemState[s.intI] !== 'open'", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sequence: [2, 1, 0]}, fn: "s.order === '2>1>0' && s.railX[2] < s.railX[1]", label: 'the supplied sequence decides the order of the cards on the rail'},
    {at: 0.1, fn: "s.itemState[s.qI] === 'stack' && s.paused === 0 && s.signal === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const st = p.statements; return [p.hearing.room, ...p.speakers.map(s => s.label), ...st.filter(s => s.kind !== 'response' || p.finalState !== 'intervention-only').map(s => s.text), ...p.exhibits, ...(st.some(s => s.kind === 'intervention') ? [p.states.intervention, p.labels.signal] : []), ...(st.some(s => s.kind === 'response') && p.finalState !== 'intervention-only' ? [p.states.response] : []), ...(st.some(s => s.kind === 'question') ? [p.labels.paused] : []), p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.witnessBox, p.objectLabels.rail, p.objectLabels.lectern, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind !== 'response' || p.finalState !== 'intervention-only').map(s => s.text), ...p.exhibits];",
  captions: 'return [p.actorLabels.participant, p.objectLabels.witnessBox, p.objectLabels.rail, p.objectLabels.lectern, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, one card moving at a time, composition fits', [
  {at: times(0.16, 0.74, 0.005), fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: 'a card text never shows before its card is open'},
  {at: times(0.16, 0.74, 0.005), fn: "s.itemState.filter(c => c === 'carried' || c === 'sliding' || c === 'travelling' || c === 'unfolding').length <= 1", label: 'one card moving at a time'},
  {at: times(0.16, 0.74, 0.005), fn: "s.itemState[s.intI] === 'none' || s.paused === 1", label: 'the reason card only moves once the question is paused'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0 && s.routesClear', label: 'the composition fits (every label placed beside its participant; every route clear)'},
  {at: times(0.16, 0.74, 0.01), fn: 's.allReached', label: 'every reach (slip, tray, paddle, response) is within the arm'},
]);

const PROPS = ['[data-node^="rm-card"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node^="rm-slipwrap"]', '[data-node^="rm-p"][data-node$="-head"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node^="rm-card"]', '[data-node^="rm-slipwrap"]', '[data-node="rm-signal"]', '[data-node="rm-pause"]']});
armsClearTest(ID, {props: PROPS});
// (the witness sits inside the walled witness box: its chip stands beyond the wall, so its leader may reach 72 px)
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 72});
// (legend ● / ◆ here; the two cards' ● / ◆ in noHierarchyTest, which compares them only when both cards are shown —
// the supplied final state 'intervention-only' shows no response card)
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-response"] path:first-of-type', '[data-node="lg-intervention"] circle']]});
neutralityTest(ID);
rulingFreeDataTest(ID);
rulingFreeRenderTest(ID);
stressLongerTest(ID);
objectionConsistencyTest(ID);
noHierarchyTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.27, 0.3, 0.45, 0.6, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="lab"][data-node$="-lead"]']});
textLinesVisibleTest(ID);

// The pause and the cards are recognisable with the labels hidden: the paused slip with its pause mark, the paddle,
// the reason and response cards with their cues (● / ◆); the witness box, its tray and the guide are drawn.
test(`${ID}: labels hidden — the question pauses on the guide and the supplied cards still arrive with their cues`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none'}});
    await x.ready;
    const svg = x.element;
    const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
    const q = sel => [...svg.querySelectorAll(sel)];
    x.seek(0.29 * x.durationMs);
    const sig = q('[data-node="rm-signal"]').map(op)[0] ?? 0, pause = q('[data-node="rm-pause"]').map(op)[0] ?? 0;
    x.seek(x.durationMs); const s = x.getState({bounds: false}).semantic;
    const shown = q('[data-node^="rm-card"][data-node$="-body"]').filter(e => op(e.parentNode) > 0.95).length;
    return {sig, pause, shown, cues: q('[data-node$="-g-open"], [data-node$="-g-bounded"]').filter(e => op(e) > 0.95).length, tray: q('[data-node="rm-tray"]').length, guide: q('[data-node="rm-guide"]').length, paused: s.paused, pauseEnd: q('[data-node="rm-pause"]').map(op)[0] ?? 0};
  }, ID);
  expect(out.sig).toBeGreaterThan(0.95);
  expect(out.pause).toBeGreaterThan(0.95);
  expect(out.pauseEnd).toBeGreaterThan(0.95);
  expect(out.shown).toBe(2);
  expect(out.cues).toBeGreaterThanOrEqual(2);
  expect(out.tray).toBe(1);
  expect(out.guide).toBe(1);
  expect(out.paused).toBe(1);
});

void presetsFor;
