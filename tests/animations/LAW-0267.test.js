// LAW-0267 — Modificación del escrito · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (whether Party A supplies a proposed
// text for the section); no legal consequence is invented to complete the contrast.
// Windows (u): headers 0.17–0.24; B's proposal appears in Party A's tray 0.24–0.32; changed-fact chip 0.28–0.36; action
// clock c = (u − 0.40) / 0.37 (B: reach 0.06–0.22, push 0.22–0.48, glide 0.48–0.80, mark 0.82–0.92; A: nothing is
// proposed); guide markers and chip 0.775–0.83; neutral note 0.80–0.86.
// LEGAL: both texts are supplied values; the proposal is only proposed; the earlier text stays whole and readable in the
// history; ● and ◆ have equal weight; no ticks, no green, no arrows; no amendment rule, time limit or effect.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE} from './modificacion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks} from './modificacion-common.js';

const ID = 'LAW-0267';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
const GL = glyphChecks('[data-node$="-glyph"], [data-node$="-gl"], [data-node$="-mk"]');

contractSuite(ID, {
  continuity: ['handSB'],
  attach: [{from: 0, to: 1, a: 'gripSB', b: 'handSB', tol: 1.5}],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.headers === 0 && s.proposalShown === 0 && s.changedShown === 0 && s.travelB === 0 && s.withProposal.join() === 'false,true'", label: 'base: two identical rooms at rest — the initial version in both; nothing proposed yet'},
    {at: 0.36, fn: "s.headers === 1 && s.proposalShown === 1 && s.changedShown > 0 && s.travelB === 0 && s.travelA === 0", label: 'change: headers shown; in B only, the proposed text appears in Party A’s tray; the changed fact is named'},
    {at: 0.6, fn: "s.travelB > 0 && s.travelA === 0 && s.oldShiftA === 0 && s.phaseA === 'rest' && s.insetProgress > 0", label: 'parallel: in B the proposal takes the section’s place; in A nothing is proposed or moved'},
    {at: 1, fn: "s.slottedB && s.oldShiftB > 0 && s.oldShiftA === 0 && s.insetProgress === 1 && s.insetTouch === 1 && s.guide === 1 && s.note === 1 && s.allReached && s.markPB === 1 && s.markPA === 0", label: 'guide: in B the proposal in the row and the earlier text in the history; the guide and the neutral note shown'},
    {at: 1, fn: 's.truncated.length === 0 && s.labelsClear && s.labelsOffFaces', label: 'layout: nothing cut; labels clear of each other, of the insets and of the people'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.slottedB && s.travelA === 0 && s.insetProgress === 1", label: 'labels hidden: the same contrast'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.labelsClear && s.allReached && s.slottedB', label: `${n}: nothing cut; labels clear; the hand reaches`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.writing.title, ...p.documents.writing.sections, p.documents.modification.text, p.stages.initial, p.stages.proposed, p.scenarioA.label, p.scenarioB.label, ...[p.scenarioA.caption, p.scenarioB.caption].filter(Boolean), p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean);",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
// the one difference reads at every size: each inset's glyphs are >= 24 px across at 1080p; A: ● in the row, the history
// tray plainly empty (no dashed or pending mark); B: ◆ in the row and ● in the history tray
const INSETS_LEGIBLE = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('inset0-old-s-gl'), b0 = q('inset1-old-s-gl'), b = q('inset1-new-s-gl');
  if (!a || !b0 || !b) return false;
  const big = e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) / K >= 24 && eff(e) > 0.9; };
  // (B: the ● strip sits right of the ◆ strip — pushed out into the history — and they do not overlap)
  const ra = q('inset1-old').getBoundingClientRect(), rb = q('inset1-new').getBoundingClientRect();
  return big(a) && big(b0) && big(b) && a.querySelector('circle') && !b.querySelector('circle') && !q('inset0-new') && rb.right <= ra.left + 1 && ![...svg.querySelectorAll('[data-node^="inset"] [stroke-dasharray]')].length;
})()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// the guide markers sit off every head and off every text they do not own
const MARKERS_CLEAR = `(() => {
  const R = e => e.getBoundingClientRect();
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const marks = [...svg.querySelectorAll('[data-node^="mark"]')].map(m => m.querySelector('circle')).filter(Boolean);
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"]')];
  const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-node^="mark"]') && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  return marks.length === 2 && marks.every(m => heads.every(h => !meet(R(m), R(h))) && texts.every(t => !meet(R(m), R(t))));
})()`;
// the earlier text stays drawn and opaque in both scenes at every sampled u (never erased)
const INITIAL_KEPT = `(() => ['sa-old-g', 'sb-old-g'].every(n => { const e = svg.querySelector('[data-node="' + n + '"]'); if (!e) return false; let o = 1; for (let x = e; x && x.tagName !== 'svg'; x = x.parentElement) { const a = x.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o > 0.99 && e.getBoundingClientRect().width > 2; }))()`;

ratioChecks(ID, 'two scenes, faces clear, in frame, figures readable, exactly one difference', [
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, header, strip item or text covers a head'},
  {at: [0.3, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (civil-claim measures the rendered HEAD box — SESSION_HANDOFF "PEOPLE-FLOOR MEASUREMENT CLARIFIED")
  {at: [0.1, 0.6, 1], presets: BASE, ratios: ['16:9', '9:16'], dom: headsAtLeast(60), label: 'heads >= 60 px at 16:9 and 9:16 in both scenes (non-stress)'},
  {at: [0.1, 0.6, 1], presets: BASE, ratios: ['1:1'], dom: headsAtLeast(55), label: 'heads >= 55 px at 1:1 in both scenes (non-stress)'},
  {at: [0.1, 0.6, 1], presets: ['long-labels-stress'], dom: headsAtLeast(45), label: 'stress: heads >= 45 px in both scenes'},
  {at: [1], dom: INSETS_LEGIBLE, label: 'RENDERED: the row and the history tray drawn large in both insets — glyphs >= 24 px across; A: ● in the row; B: ◆ in the row, ● in the history (labels shown or hidden)'},
  {at: times(0, 1, 0.1), dom: INITIAL_KEPT, label: 'LEGAL: the earlier text stays drawn and opaque in both scenes (never erased)'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the two scenes and the strip fill the caption-safe box (labels shown or hidden)'},
  {at: [0.85, 1], tv: ['all'], dom: MARKERS_CLEAR, label: 'RENDERED: the guide markers sit off every head and every text'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: GL.neutral, label: 'LEGAL: glyphs are only ● / ◆ — no ticks, no green'},
  {at: [1], dom: GL.equal, label: 'LEGAL: ● and ◆ have equal weight'},
  {at: [0, 1], dom: NO_ARROWS, label: 'no arrowhead markers'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.4, 0.8, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' ').replace(/\\u00a0/g, ' '); return !/\\b(Party|fictional|Case file|Claim|Initial|Proposed|version|supplied|Same in|Changed fact|only in B|section|history|Request|conclusion|As supplied)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.6, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person'},
]);
hiddenText(ID, [0, 0.3, 0.6, 1]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});

// thin windows: the push lasts >= 600 ms, the glide >= 600 ms and the appearance of the proposal >= 400 ms
test(`${ID}: thin windows measured — appearance, push and glide`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  const rows = [];
  for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, timeMs: t}).semantic);
  expect(rows.filter(s => s.proposalShown > 0 && s.proposalShown < 1).length * 1000 / 60).toBeGreaterThanOrEqual(400);
  expect(rows.filter(s => s.phaseB === 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.travelB > 0 && !s.slottedB && s.phaseB !== 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; nothing moves in A; B's travel never decreases
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.travelA === 0 && s.oldShiftA === 0, tag).toBe(true);
      expect(s.travelB >= prev - 1e-6, tag).toBe(true);
      prev = s.travelB;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
    }
  }
});
