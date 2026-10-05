// LAW-0265 — Modificación del escrito · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (Party A's hand on the proposal's edge while pushing:
// SOLVED hand position) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65. Windows (c → u): reach 0.06–0.22 → 0.189–0.293; push 0.22–0.48 → 0.293–0.462; glide
// 0.48–0.80 → 0.462–0.670; hand back 0.50–0.66 → 0.475–0.579; calendar mark 0.82–0.92 → 0.683–0.748; tag 0.90–0.97 →
// 0.735–0.781; callout u 0.80–0.86.
// LEGAL: both texts are supplied values; the proposal is only proposed (never shown as approved or rejected); the
// earlier text stays whole and readable in the change history ("was:"), joined to its row by a neutral line — no
// strike; ● and ◆ have equal weight; no arrows; no amendment rule, time limit or effect.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, tagsOffProps, TEXT_LINES_VISIBLE} from './modificacion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks} from './modificacion-common.js';

const ID = 'LAW-0265';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['hand'],
  attach: [
    {from: 0, to: 1, a: 'grip', b: 'hand', tol: 1.5},
    {from: 0.3, to: 0.455, a: 'stripGrip', b: 'hand', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.phase === 'rest' && s.travel === 0 && s.oldShift === 0 && !s.slotted && s.tags.history === 0 && s.markP === 0", label: 'rest: the initial version in its row; the proposal in Party A’s tray'},
    {at: 0.4, fn: "s.phase === 'push' && s.travel > 0 && s.overlap === 0 && (s.contact === 0 ? s.oldShift === 0 : true)", label: 'Party A pushes the proposal rightwards by its edge; the earlier strip moves only once touched'},
    {at: 0.6, fn: "s.travel > 0 && s.overlap === 0 && s.oldShift > 0", label: 'the proposal glides on alone and pushes the earlier strip out towards the history tray; they never overlap'},
    {at: 1, fn: "s.slotted && s.inRow && s.inHistory && s.overlap === 0 && s.markP === 1 && s.tags.history === 1 && s.notes === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear && s.labelsOffFaces", label: 'hold: the proposal in the row, the earlier text kept in the history tray, the day marked, the tag and callout shown'},
    {at: 1, params: {finalState: 'held'}, fn: "!s.slotted && s.travel === 0 && s.oldShift === 0 && s.markP === 0 && s.tags.history === 0 && s.phase === 'hold'", label: 'finalState held (as supplied): the proposal stays in Party A’s tray; nothing is replaced'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && !s.slotted && s.tags.history === 0', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.slotted && s.inHistory && s.overlap === 0', label: 'labels hidden: the same transformation'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached && s.slotted && s.inHistory', label: `${n}: nothing cut; the proposal in the row, the earlier text in the history`})),
    {at: 1, params: P('contrast-or-alternative'), fn: '!s.slotted && s.oldShift === 0 && s.truncated.length === 0', label: 'contrast (held): nothing cut; the proposal stays in the tray'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const held = p.finalState === 'held'; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.writing.title, ...p.documents.writing.sections, p.documents.modification.text, ...p.dates.window, p.stages.initial, p.stages.proposed, ...(held ? [] : [p.stages.history]), p.objectLabels.calendar, p.objectLabels.trayA, p.objectLabels.history, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const GL = glyphChecks('[data-node="st-old-glyph"], [data-node="st-new-glyph"]');
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// the difference reads with labels hidden: at the hold the proposal (◆) stands in the row on the board and the earlier
// strip (●) in the history tray, apart, both drawn whole (no strike line across the earlier strip)
const HISTORY_KEPT = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const bd = q('st-board').getBoundingClientRect(), nw = q('st-new').getBoundingClientRect(), od = q('st-old').getBoundingClientRect(), tr = q('st-trH-back').getBoundingClientRect();
  const inBoard = nw.left >= bd.left - 2 && nw.right <= bd.right + 2;
  const inTray = od.left >= tr.left - 2 && od.right <= tr.right + 2;
  const apart = Math.min(nw.right, od.right) - Math.max(nw.left, od.left) <= 1;
  const struck = [...q('st-old').querySelectorAll('line')].length > 0;
  return inBoard && inTray && apart && !struck;
})()`;
const TAGS_OFF_PROPS = tagsOffProps(['st-board', 'st-old', 'st-new', 'st-cal', 'st-trA-back', 'st-trA-front', 'st-trH-back', 'st-trH-front', 'st-plA', 'st-plH']);

ratioChecks(ID, 'faces, cards, frame, people, tags, legal', [
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or text covers a head'},
  {at: [0, 0.4, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (civil-claim measures the rendered HEAD box: the story floor is 52 px in every preset and ratio)
  {at: [0.1, 0.5, 1], dom: headsAtLeast(52), label: 'people readable: head >= 52 px at 1080p (the civil-claim story floor), every preset and ratio'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box at rest and hold (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-', 'note']), label: 'each tag sits beside its own element (leader <= 40 px), its leader crosses no text'},
  {at: [0.78, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no stage tag intersects any prop or any text'},
  {at: [1], presets: ['default', 'baseline-illustrative', 'baseline-es', 'long-labels-stress'], dom: HISTORY_KEPT, label: 'RENDERED: at the hold the proposal stands in the row and the earlier text, whole and unstruck, in the history tray (labels shown or hidden)'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: GL.neutral, label: 'LEGAL: version glyphs are only ● / ◆ — no ticks, no green'},
  {at: [1], dom: GL.equal, label: 'LEGAL: ● and ◆ have equal weight'},
  {at: [0, 1], dom: NO_ARROWS, label: 'no arrowhead markers'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.15, 0.8, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' ').replace(/\\u00a0/g, ' '); return !/\\b(Party|Day \\d|fictional|Case file|Claim|Initial|Proposed|version|supplied|Calendar|History|Earlier|kept|Request|Facts|was|As supplied)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.4, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person'},
]);
hiddenText(ID, [0, 0.4, 0.7, 1]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});

// thin windows: the push lasts >= 600 ms and the glide >= 600 ms
test(`${ID}: thin windows measured — push and glide`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  const rows = [];
  for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, timeMs: t}).semantic);
  expect(rows.filter(s => s.phase === 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.travel > 0 && !s.slotted && s.phase !== 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; the strips never overlap; the proposal and the earlier
// strip only move rightwards (cause before effect: the earlier strip moves only once touched); nothing cut
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let prevN = -1, prevO = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.overlap, tag).toBe(0);
      expect(s.travel >= prevN - 1e-6 && s.oldShift >= prevO - 1e-6, tag).toBe(true);
      expect(s.contact > 0 || s.oldShift === 0, tag).toBe(true);
      prevN = s.travel; prevO = s.oldShift;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
    }
  }
});
