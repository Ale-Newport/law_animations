// LAW-0269 — Acumulación de pretensiones · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (Party A's hand on the push bar's grip while pushing:
// SOLVED hand position) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65. Windows (c → u): reach 0.06–0.22 → 0.189–0.293; push 0.22–0.48 → 0.293–0.462; glide
// 0.48–0.80 → 0.462–0.670; hand back 0.50–0.66 → 0.475–0.579; calendar mark 0.84–0.94 → 0.696–0.761; configuration
// marks u 0.675–0.75; callout u 0.80–0.86.
// LEGAL: joint handling (●) and separate folders (◆) are supplied configurations of equal weight; every folder keeps its
// own label; no folder merges into another; no arrows; no rule for joining claims, time limit, ruling or effect.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, NO_LONE_LINES} from './acumulacion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks, esDefaults} from './acumulacion-common.js';

const ID = 'LAW-0269';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['hand'],
  attach: [
    {from: 0, to: 1, a: 'grip', b: 'hand', tol: 1.5},
    {from: 0.3, to: 0.455, a: 'barGrip', b: 'hand', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.phase === 'rest' && s.travel === 0 && !s.slotted && s.config === null && s.markP === 0", label: 'rest: every folder in its own tray; no configuration drawn yet'},
    {at: 0.4, fn: "s.phase === 'push' && s.travel > 0 && s.barD === s.travel && s.config === null && s.overlap === 0", label: 'Party A pushes every folder at once with the bar; the bar moves with the folders'},
    {at: 0.6, fn: "s.travel > s.barD && s.config === null && s.overlap === 0", label: 'the folders glide on together past the rack’s end; the bar stays at the rack’s end'},
    {at: 1, fn: "s.slotted && s.inRow && s.config === 'joint' && s.jointP === 1 && s.sepP === 0 && s.markP === 1 && s.notes === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear && s.labelsOffFaces", label: 'hold: every folder in its slot; the joint configuration drawn (one frame, one spine); the day marked; the callout shown'},
    {at: 1, params: {finalState: 'separate'}, fn: "s.slotted && s.inRow && s.config === 'separate' && s.sepP === 1 && s.jointP === 0", label: 'finalState separate (as supplied): one frame and one clip per folder; the joint marks never shown'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && !s.slotted && s.config === null', label: 'actionProgress freezes the action part-way; no configuration is drawn'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.slotted && s.inRow && s.config === 'joint'", label: 'labels hidden: the same transformation'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: "s.truncated.length === 0 && s.allReached && s.slotted && s.config === 'joint'", label: `${n}: nothing cut; every folder in its slot`})),
    {at: 1, params: P('contrast-or-alternative'), fn: "s.slotted && s.config === 'separate' && s.truncated.length === 0", label: 'contrast (separate): nothing cut; one frame per folder'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const sep = p.finalState === 'separate'; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.documents.claims, ...p.dates.window, p.stages.joint, p.stages.separate, p.objectLabels.calendar, p.objectLabels.trays, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const GL = glyphChecks('[data-node="st-pj-glyph"], [data-node="st-ps-glyph"]');
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// every folder keeps its own label: each folder is drawn whole and opaque, apart from every other folder (no overlap),
// with its own sticker; with labels shown each sticker carries its own claim's text (on the folder or in the column)
const LABELS_KEPT = `(() => {
  const fs = [...svg.querySelectorAll('[data-node^="st-f"][data-node$="-g"]')];
  if (fs.length < 2) return false;
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const rs = fs.map(f => f.getBoundingClientRect());
  const apart = rs.every((a, i) => rs.every((b, j) => i === j || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1 || Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1));
  return apart && fs.every(f => eff(f) > 0.99 && f.getBoundingClientRect().width > 4);
})()`;
// the configuration reads with labels hidden: at the hold ONE jacket frame and ONE spine round all the folders (joint) or
// one frame and one clip per folder (separate) — never both; the marks never cover a folder's sticker
const CONFIG_DRAWN = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const mj = q('st-mj'), ms = q('st-ms');
  if (!mj || !ms) return false;
  const one = (eff(mj) > 0.99) !== (eff(ms) > 0.99) && Math.min(eff(mj), eff(ms)) < 0.01;
  const fs = [...svg.querySelectorAll('[data-node^="st-f"][data-node$="-g"]')].map(f => f.getBoundingClientRect());
  const bd = q('st-board').getBoundingClientRect();
  const inBoard = fs.every(r => r.left >= bd.left - 2 && r.right <= bd.right + 2);
  return one && inBoard;
})()`;

ratioChecks(ID, 'faces, cards, frame, people, legal', [
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, note or text covers a head'},
  {at: [0, 0.4, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (civil-claim measures the rendered HEAD box: the story floor is 52 px in every preset and ratio)
  {at: [0.1, 0.5, 1], dom: headsAtLeast(52), label: 'people readable: head >= 52 px at 1080p (the civil-claim story floor), every preset and ratio'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box at rest and hold (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['note']), label: 'each callout marker sits beside its own element'},
  {at: times(0, 1, 0.05), dom: LABELS_KEPT, label: 'RENDERED: every folder drawn whole, opaque and apart from every other at every sampled u (each keeps its own label)'},
  {at: [1], dom: CONFIG_DRAWN, label: 'RENDERED: at the hold one configuration only — never both — with every folder on the board (labels shown or hidden)'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: GL.neutral, label: 'LEGAL: configuration glyphs are only ● / ◆ — no ticks, no green'},
  {at: [1], params: {finalState: 'separate'}, dom: GL.neutral, label: 'LEGAL: separate — glyphs are only ● / ◆'},
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
esDefaults(ID, [0.45, 1]);

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.4, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person'},
]);
hiddenText(ID, [0, 0.4, 0.7, 1]);

ratioChecks(ID, 'no one-word lines', [
  {at: times(0, 1, 0.05), tv: ['all'], dom: NO_LONE_LINES, label: 'RENDERED: no wrapped title, chip, tag, plate, card or label has a one-word line (every 0.05; es-only too)'},
  {at: [0.3, 0.6, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: NO_LONE_LINES, label: 'RENDERED: es-only — no one-word line'},
]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});

// thin windows: the push lasts >= 600 ms, the glide >= 600 ms, the configuration appears over >= 400 ms
test(`${ID}: thin windows measured — push, glide, configuration`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  const rows = [];
  for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, timeMs: t}).semantic);
  expect(rows.filter(s => s.phase === 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.travel > 0 && !s.slotted && s.phase !== 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.jointP > 0 && s.jointP < 1).length * 1000 / 60).toBeGreaterThanOrEqual(400);
  // (the configuration appears only once every folder is in its slot)
  expect(rows.filter(s => s.jointP > 0 && !s.slotted)).toEqual([]);
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; the folders never overlap and only move rightwards;
// never both configurations; nothing cut
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.overlap, tag).toBe(0);
      expect(s.travel >= prev - 1e-6, tag).toBe(true);
      expect(s.jointP === 0 || s.sepP === 0, tag).toBe(true);
      prev = s.travel;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
    }
  }
});
