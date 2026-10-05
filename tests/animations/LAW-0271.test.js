// LAW-0271 — Acumulación de pretensiones · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (how the claim folders are arranged on
// the case file: one frame and one spine round all of them in A, one frame and one clip each in B); no legal
// consequence is invented to complete the contrast.
// Windows (u): headers 0.17–0.24; the configuration marks appear 0.24–0.32; changed-fact chip 0.28–0.36; action clock
// c = (u − 0.40) / 0.37 in both scenes (reach 0.06–0.22, push 0.22–0.48, glide 0.48–0.80, mark 0.84–0.94); guide
// markers and chip 0.775–0.83; neutral note 0.80–0.86.
// LEGAL: joint handling (●) and separate folders (◆) are supplied configurations of equal weight; every folder keeps its
// own label; no ticks, no green, no arrows; no rule for joining claims, condition, time limit, ruling or effect.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, NO_LONE_LINES} from './acumulacion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks, esDefaults} from './acumulacion-common.js';
import {identicalBeforeChange} from '../harness/supplied-text.js';

const ID = 'LAW-0271';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
const GL = glyphChecks('[data-node$="-glyph"], [data-node$="-gl"], [data-node$="-mk"]');

contractSuite(ID, {
  continuity: ['handSB', 'handSA'],
  attach: [{from: 0, to: 1, a: 'gripSB', b: 'handSB', tol: 1.5}, {from: 0, to: 1, a: 'gripSA', b: 'handSA', tol: 1.5}],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.headers === 0 && s.configShown === 0 && s.changedShown === 0 && s.travelA === 0 && s.travelB === 0 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB)", label: 'base: two identical rooms at rest — the folders in their trays; no configuration drawn'},
    {at: 0.36, fn: "s.headers === 1 && s.configShown === 1 && s.changedShown > 0 && s.lookA.joint === 1 && s.lookA.separate === 0 && s.lookB.separate === 1 && s.lookB.joint === 0 && s.travelA === 0 && s.travelB === 0", label: 'change: headers; A one frame and one spine (joint), B one frame and one clip each (separate); the changed fact named'},
    {at: 0.6, fn: "s.travelB > 0 && s.travelA === s.travelB && s.phaseA === s.phaseB && s.insetProgress > 0", label: 'parallel: in both rooms Party A pushes the folders identically'},
    {at: 1, fn: "s.slottedA && s.slottedB && s.insetProgress === 1 && s.guide === 1 && s.note === 1 && s.allReached && s.markPB === 1 && s.markPA === 1", label: 'guide: every folder in its slot in both rooms; the guide and the neutral note shown'},
    {at: 1, fn: 's.truncated.length === 0 && s.labelsClear && s.labelsOffFaces', label: 'layout: nothing cut; labels clear of each other, of the insets and of the people'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.slottedB && s.lookA.joint === 1 && s.lookB.separate === 1 && s.insetProgress === 1", label: 'labels hidden: the same contrast'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.labelsClear && s.allReached && s.slottedB && s.slottedA', label: `${n}: nothing cut; labels clear; the hands reach`})),
  ],
});
identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.documents.claims, p.stages.joint, p.stages.separate, p.scenarioA.label, p.scenarioB.label, ...[p.scenarioA.caption, p.scenarioB.caption].filter(Boolean), p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean);",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
// the one difference reads at every size: each inset's glyph is >= 24 px across at 1080p (A ●, B ◆); A one frame and one
// spine round all the folders, B one frame and one clip per folder; every folder in its slot; no dashed mark
const INSETS_LEGIBLE = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('inset0-gl'), b = q('inset1-gl'), ma = q('inset0-marks'), mb = q('inset1-marks'), fa = q('inset0-f'), fb = q('inset1-f');
  if (!a || !b || !ma || !mb || !fa || !fb) return false;
  const big = e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) / K >= 24 && eff(e) > 0.9; };
  const n = fa.children.length;
  const oneA = ma.querySelectorAll(':scope > path').length === 2, eachB = mb.querySelectorAll(':scope > g').length === n;
  return n >= 2 && big(a) && big(b) && a.querySelector('circle') && !b.querySelector('circle') && oneA && eachB && eff(ma) > 0.9 && eff(mb) > 0.9 && ![...svg.querySelectorAll('[data-node^="inset"] [stroke-dasharray]')].length;
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
// every claim folder stays drawn and opaque in both scenes at every sampled u, apart from the others (each keeps its own
// label; none is erased or merged)
const FOLDERS_KEPT = `(() => ['sa', 'sb'].every(P => { const fs = [...svg.querySelectorAll('[data-node^="' + P + '-f"][data-node$="-g"]')]; if (fs.length < 2) return false;
  const rs = fs.map(e => e.getBoundingClientRect());
  return fs.every(e => { let o = 1; for (let x = e; x && x.tagName !== 'svg'; x = x.parentElement) { const a = x.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o > 0.99 && e.getBoundingClientRect().width > 2; })
    && rs.every((a, i) => rs.every((b, j) => i === j || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 0.5)); }))()`;

ratioChecks(ID, 'two scenes, faces clear, in frame, figures readable, exactly one difference', [
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, header, strip item or text covers a head'},
  {at: [0.3, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (civil-claim measures the rendered HEAD box — SESSION_HANDOFF "PEOPLE-FLOOR MEASUREMENT CLARIFIED")
  {at: [0.1, 0.6, 1], presets: BASE, ratios: ['16:9', '9:16'], dom: headsAtLeast(60), label: 'heads >= 60 px at 16:9 and 9:16 in both scenes (non-stress)'},
  {at: [0.1, 0.6, 1], presets: BASE, ratios: ['1:1'], dom: headsAtLeast(55), label: 'heads >= 55 px at 1:1 in both scenes (non-stress)'},
  {at: [0.1, 0.6, 1], presets: ['long-labels-stress'], dom: headsAtLeast(45), label: 'stress: heads >= 45 px in both scenes'},
  {at: [1], dom: INSETS_LEGIBLE, label: 'RENDERED: the slots column drawn large in both insets — glyphs >= 24 px across; A: ● one frame and one spine; B: ◆ one frame and one clip per folder (labels shown or hidden)'},
  {at: times(0, 1, 0.1), dom: FOLDERS_KEPT, label: 'LEGAL: every claim folder stays drawn, opaque and apart in both scenes (each keeps its own label)'},
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

esDefaults(ID, [0.5, 1], '|only|frames|differ|arranged|How');

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.6, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person'},
]);
hiddenText(ID, [0, 0.3, 0.6, 1]);

ratioChecks(ID, 'no one-word lines', [
  {at: times(0, 1, 0.05), tv: ['all'], dom: NO_LONE_LINES, label: 'RENDERED: no wrapped title, chip, tag, plate, card or label has a one-word line (every 0.05; es-only too)'},
  {at: [0.3, 0.6, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: NO_LONE_LINES, label: 'RENDERED: es-only — no one-word line'},
]);
// the changed fact reads in each room: the configuration's marks (A one frame and spine, B one frame and clip each) span
// >= 85 px in each dimension at 1080p at the hold in the baseline presets, >= 70 px under long-labels-stress, every
// ratio (reviewer item 18: about 90 px at 1:1)
const changeLarge = min => `(() => { const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  return ['sa-mj', 'sb-ms'].every(n => { const e = svg.querySelector('[data-node="' + n + '"]'); if (!e) return false; const b = e.getBoundingClientRect(); return Math.min(b.width, b.height) / K >= ${min}; }); })()`;
ratioChecks(ID, 'changed fact large in each room', [
  {at: [1], presets: BASE, dom: changeLarge(85), label: 'RENDERED: the configuration marks in each room span >= 85 px (1080p) in both dimensions'},
  {at: [1], presets: ['long-labels-stress'], dom: changeLarge(70), label: 'RENDERED: stress — the configuration marks span >= 70 px in both dimensions'},
]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});

// thin windows: the push lasts >= 600 ms, the glide >= 600 ms and the appearance of the configuration >= 400 ms
test(`${ID}: thin windows measured — configuration, push and glide`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  const rows = [];
  for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, timeMs: t}).semantic);
  expect(rows.filter(s => s.configShown > 0 && s.configShown < 1).length * 1000 / 60).toBeGreaterThanOrEqual(400);
  expect(rows.filter(s => s.phaseB === 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.travelB > 0 && !s.slottedB && s.phaseB !== 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; A and B act identically; travel never decreases;
// never both configurations in one room; identical before the change beat
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.travelA === s.travelB, tag).toBe(true);
      expect(s.lookA.separate === 0 && s.lookB.joint === 0, tag).toBe(true);
      if (u < 0.17) expect(JSON.stringify(s.lookA), tag).toBe(JSON.stringify(s.lookB));
      expect(s.travelB >= prev - 1e-6, tag).toBe(true);
      prev = s.travelB;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
    }
  }
});
