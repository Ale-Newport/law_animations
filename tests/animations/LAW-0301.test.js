// LAW-0301 — Exhibición de documento · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the presenter's pointing hand is the solved
// hand; the document travels from its exhibit along the lane to its place and grows to a page, its reference tag with
// it; the enlarged copy grows out of the region frame, tethered) and the transformation (the page and its enlarged zone
// on the board) recognisable with labels hidden.
// Timing (u): rest 0–0.16 · the presenter points 0.16–0.216 · the document travels 0.216–0.395 · its tag 0.395–0.44 ·
// the region frame 0.451–0.507 · the enlarged zone grows 0.518–0.653 · its caption 0.653–0.709 · notes 0.75–0.80 ·
// state tag 0.76–0.81; still from 0.81.
// Legal: ● complete document / ◆ selected detail are supplied states of equal weight; the document's content is generic
// (lines and blocks); the region is only a supplied region (no authenticity, admissibility, weight or ruling).
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
import {bannedDataTest, bannedRenderTest, stressLongerTest, documentConsistencyTest, glyphStateTest, noTwinTextTest, ES_WORDS, FLOOR_FOR} from './exhibicion-documento-checks.js';

const ID = 'LAW-0301';

contractSuite(ID, {
  continuity: ['doc', 'hand'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.docState === 'cabinet' && s.tag === 0 && s.frame === 0 && s.zoom === 0 && s.pointing === 0", label: 'rest: the document lies on its exhibit; the board is empty; nobody points'},
    {at: 0.155, fn: "s.docState === 'cabinet' && s.pointing === 0", label: 'nothing moves during the rest beat'},
    {at: 0.21, fn: "s.pointing > 0.9 && s.docState === 'cabinet'", label: 'the presenter points to the board before the document moves (cause before effect)'},
    {at: 0.3, fn: "s.docState === 'travelling' && s.tag === 0", label: 'the document travels along the lane to its place'},
    {at: 0.42, fn: "s.docState === 'placed' && s.docScale === 1 && s.tag > 0 && s.frame === 0", label: 'the page has settled and its reference tag arrives; no region is marked yet'},
    {at: 0.51, fn: "s.frame === 1 && s.zoom === 0", label: 'the region frame is drawn before anything is enlarged'},
    {at: 0.6, fn: "s.zoneState === 'enlarging' && s.caption === 0", label: 'the enlarged copy grows out of the frame into the zone'},
    {at: 1, fn: "s.docState === 'placed' && s.tag === 1 && s.frame === 1 && s.zoom === 1 && s.zoneState === 'enlarged' && s.caption === 1 && s.finalState === 'detail-enlarged' && s.allReached && s.problems.length === 0 && s.zoneZoom > 1.3", label: 'hold: the page with its reference and the enlarged zone with its caption on the board; the composition fits'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.zoneState === 'enlarging' && s.docState === 'placed'", label: 'labels hidden: the same travel and enlargement happen'},
    {at: 1, params: {finalState: 'document-only'}, fn: "s.docState === 'placed' && s.zoneState === 'none' && s.frame === 0", label: 'supplied final state: the page only, no zone enlarged'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.zoneState === 'none'", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sequence: [1, 0]}, fn: "s.order === '1>0' && s.boardLeft === 'detail' && s.zone.x < s.page.x", label: 'the supplied sequence decides the order of the places on the board'},
    {at: 0.1, fn: "s.docState === 'cabinet' && s.tag === 0 && s.zoom === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const det = p.finalState !== 'document-only'; return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'document' || det).map(s => s.text), ...p.exhibits, p.states.document, ...(det ? [p.states.detail, p.labels.frame] : []), p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.cabinet, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.kind === 'document' || p.finalState !== 'document-only').map(s => s.text), ...p.exhibits];",
  captions: 'return [p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.cabinet, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, one thing moving at a time, composition fits', [
  {at: times(0.16, 0.74, 0.005), fn: "s.docState === 'cabinet' || s.pointing > 0 || s.tag > 0", label: 'the document only moves once the presenter has pointed'},
  {at: times(0.16, 0.74, 0.005), fn: "!(s.docState === 'travelling' && (s.frame > 0 || s.zoom > 0))", label: 'one thing at a time: nothing is marked or enlarged while the document travels'},
  {at: times(0.16, 0.74, 0.005), fn: 's.zoom === 0 || s.frame === 1', label: 'the zone only grows once its region is framed'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.16, 0.74, 0.01), fn: 's.allReached', label: 'the pointing hand stays within the arm'},
]);

const PROPS = ['[data-node="rm-board"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node="rm-doc"]', '[data-node^="rm-p"][data-node$="-head"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node="rm-doc"]', '[data-node="rm-board"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 72});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-detail"] path:first-of-type', '[data-node="lg-document"] circle'], ['[data-node="rm-capplate-g"]', '[data-node="rm-tagplate-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
stressLongerTest(ID);
documentConsistencyTest(ID);
glyphStateTest(ID, {at: [0.5, 1]});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.6, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="lab"][data-node$="-lead"]', '[data-node="rm-tethers"]']});
textLinesVisibleTest(ID);

// The action is recognisable with the labels hidden: the page on the board, its frame, the enlarged copy in the zone
// and its tethers; the exhibit place on the cabinet.
test(`${ID}: labels hidden — the page settles on the board and its region is enlarged into the zone`, async ({page}) => {
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
    x.seek(0.1 * x.durationMs); const at0 = q('[data-node="rm-doc"]').getBoundingClientRect();
    x.seek(x.durationMs);
    const at1 = q('[data-node="rm-doc"]').getBoundingClientRect();
    return {moved: Math.hypot(at1.x - at0.x, at1.y - at0.y), grew: at1.width / at0.width, frame: op(q('[data-node="rm-frame-main"]')), zone: op(q('[data-node="rm-zcopy-main"]')), tethers: op(q('[data-node="rm-tethers"]')), text: [...svg.querySelectorAll('[data-node="rm-tag"] text, [data-node="rm-cap"] text')].length};
  }, ID);
  expect(out.moved).toBeGreaterThan(40);
  expect(out.grew).toBeGreaterThan(1.8);
  expect(out.frame).toBeGreaterThan(0.95);
  expect(out.zone).toBeGreaterThan(0.95);
  expect(out.tethers).toBeGreaterThan(0.95);
  expect(out.text).toBe(0);
});

void presetsFor;
