// LAW-0261 — Reconvención ilustrativa · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (Party B's hand on the additional claim's edge while
// pushing: SOLVED hand position) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65. Windows (c → u): reach 0.06–0.22 → 0.189–0.293; push 0.22–0.48 → 0.293–0.462; glide
// 0.48–0.80 → 0.462–0.670; hand back 0.50–0.66 → 0.475–0.579; calendar mark 0.82–0.92 → 0.683–0.748; tag 0.90–0.97 →
// 0.735–0.781; callout u 0.80–0.86.
// LEGAL: both claims are supplied values; nothing states a rule for an additional claim or any effect; the additional
// claim never covers, moves or erases the initial one; ● and ◆ have equal weight; no arrows.
// STRESS CAP (item 20): long-labels-stress caps the claim summaries, party roles, case-file reference and day labels
// (each still strictly longer than the baseline). Driver: at 1:1 every supplied text is printed in a column over the
// scene and the long names in 3-line chips under the people, which leaves the counter too short — uncapped, the
// rendered head at 1:1 was 24.4 px (stress floor 45); capped, 54.2 px (16:9 60.8, 9:16 116.8).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, tagsOffProps, TEXT_LINES_VISIBLE} from './reconvencion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks} from './reconvencion-common.js';

const ID = 'LAW-0261';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];

contractSuite(ID, {
  continuity: ['hand'],
  attach: [
    {from: 0, to: 1, a: 'grip', b: 'hand', tol: 1.5},
    {from: 0.3, to: 0.455, a: 'sheetGrip', b: 'hand', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.phase === 'rest' && s.additionalTravel === 0 && !s.slotted && s.tags.both === 0 && s.markP === 0", label: 'rest: the initial claim in its sleeve; the additional claim at the far end of its lane'},
    {at: 0.4, fn: "s.phase === 'push' && s.additionalTravel > 0 && s.travelDir === -1 && s.overlap === 0", label: 'Party B pushes the additional claim leftwards — the opposite way to the initial claim’s lane — by its edge'},
    {at: 0.6, fn: "s.additionalTravel > 0 && !s.slotted && s.overlap === 0", label: 'the additional claim glides on alone; it never covers the initial claim'},
    {at: 1, fn: "s.slotted && s.overlap === 0 && s.markP === 1 && s.tags.both === 1 && s.notes === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear && s.labelsOffFaces", label: 'hold: both claims in the case file side by side, the day marked, the tag and callout shown, nothing cut'},
    {at: 1, params: {finalState: 'held'}, fn: "!s.slotted && s.additionalTravel === 0 && s.markP === 0 && s.tags.both === 0 && s.phase === 'hold'", label: 'finalState held (as supplied): the additional claim stays with Party B; nothing is marked'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && !s.slotted && s.tags.both === 0', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.slotted && s.overlap === 0', label: 'labels hidden: the same transformation (both claims in the file)'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached && s.slotted', label: `${n}: nothing cut; the additional claim filed`})),
    {at: 1, params: P('contrast-or-alternative'), fn: '!s.slotted && s.truncated.length === 0', label: 'contrast (held): nothing cut; the additional claim stays at its lane end'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const held = p.finalState === 'held'; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.initialClaim.title, p.documents.initialClaim.summary, p.documents.additionalClaim.title, p.documents.additionalClaim.summary, ...p.dates.window, p.stages.initial, p.stages.additional, ...(held ? [] : [p.stages.both]), p.objectLabels.calendar, p.objectLabels.trayA, p.objectLabels.trayB, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const GL = glyphChecks('[data-node="st-ci-glyph"], [data-node="st-ca-glyph"]');
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// the difference reads with labels hidden: both claims' glyphs are visible at the hold, the additional one inside the
// right sleeve (its sheet's box within the case file's rack)
const BOTH_IN_FILE = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const rk = q('st-rack').getBoundingClientRect(), a = q('st-ca').getBoundingClientRect(), i = q('st-ci').getBoundingClientRect();
  const inside = b => b.left >= rk.left - 2 && b.right <= rk.right + 2;
  const apart = Math.min(a.right, i.right) - Math.max(a.left, i.left) <= 1 || Math.min(a.bottom, i.bottom) - Math.max(a.top, i.top) <= 1;
  return inside(a) && inside(i) && apart;
})()`;
const TAGS_OFF_PROPS = tagsOffProps(['st-rack', 'st-ci', 'st-ca', 'st-cal', 'st-tr0-back', 'st-tr0-front', 'st-tr1-back', 'st-tr1-front']);

ratioChecks(ID, 'faces, cards, frame, figures, tags, legal', [
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or text covers a head'},
  {at: [0, 0.4, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (civil-claim measures the rendered HEAD box — SESSION_HANDOFF "PEOPLE-FLOOR MEASUREMENT CLARIFIED": the story floor
  // is 52 px in every preset and ratio, labels shown or hidden)
  {at: [0.1, 0.5, 1], dom: headsAtLeast(52), label: 'people readable: head >= 52 px at 1080p (the civil-claim story floor), every preset and ratio'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box at rest and hold (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-', 'note']), label: 'each tag sits beside its own element (leader <= 40 px), its leader crosses no text'},
  {at: [0.78, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no stage tag intersects any prop or any text'},
  {at: [1], presets: ['default', 'baseline-illustrative', 'baseline-es', 'long-labels-stress'], dom: BOTH_IN_FILE, label: 'RENDERED: at the hold both claims stand in the case file, apart (labels shown or hidden)'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: GL.neutral, label: 'LEGAL: claim glyphs are only ● / ◆ — no ticks, no green'},
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
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' ').replace(/\\u00a0/g, ' '); return !/\\b(Party|Day \\d|fictional|Case file|Claim|Initial|Additional|claim|supplied|Calendar|Both|kept|joins|stays|As supplied)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
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
  expect(rows.filter(s => s.additionalTravel > 0 && !s.slotted && s.phase !== 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; the initial claim never moves; the two sheets
// never overlap; the additional claim travels only leftwards (its travel never decreases)
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let x0 = null, prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      if (x0 === null) x0 = s.initialX;
      expect(s.initialX, tag).toBe(x0);
      expect(s.overlap, tag).toBe(0);
      expect(s.additionalTravel >= prev - 1e-6, tag).toBe(true);
      prev = s.additionalTravel;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
    }
  }
});
