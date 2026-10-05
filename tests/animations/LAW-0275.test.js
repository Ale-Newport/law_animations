// LAW-0275 — Intervención de tercero · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (where Party C's card is: in her tray
// with one frame round Party A's and Party B's cards in A, in the third slot with one frame round all three in B); no
// legal consequence is invented to complete the contrast.
// Windows (u): headers 0.17–0.24; the configuration marks appear 0.24–0.32; changed-fact chip 0.28–0.36; action clock
// c = (u − 0.40) / 0.37 in B only (reach 0.06–0.22, push 0.22–0.48, glide 0.48–0.80, mark 0.84–0.94); in A Party C's card
// stays in her tray; guide markers and chip 0.775–0.83; neutral note 0.80–0.86.
// LEGAL: the initial relation (●) and the intervention requested (◆) are supplied configurations of equal weight; the
// request is never shown as granted or refused; every card keeps its own label; no ticks, no green, no arrows; no rule
// for intervention, standing test, time limit, ruling or effect.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, NO_LONE_LINES, peopleInsideRooms} from './intervencion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks, esDefaults, glyphGlue} from './intervencion-common.js';
import {identicalBeforeChange} from '../harness/supplied-text.js';

const ID = 'LAW-0275';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
const GL = glyphChecks('[data-node$="-glyph"], [data-node$="-gl"], [data-node$="-mk"]');

contractSuite(ID, {
  continuity: ['handSB', 'handSA'],
  attach: [{from: 0, to: 1, a: 'gripSB', b: 'handSB', tol: 1.5}, {from: 0, to: 1, a: 'gripSA', b: 'handSA', tol: 1.5}],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.headers === 0 && s.configShown === 0 && s.changedShown === 0 && s.travelA === 0 && s.travelB === 0 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB)", label: 'base: two identical rooms at rest — Party C’s card in her tray; no configuration drawn'},
    {at: 0.36, fn: "s.headers === 1 && s.configShown === 1 && s.changedShown > 0 && s.lookA.initial === 1 && s.lookA.requested === 0 && s.lookB.requested === 1 && s.lookB.initial === 0 && s.travelA === 0 && s.travelB === 0", label: 'change: headers; A one frame round two cards (initial relation), B one frame round three slots (intervention requested); the changed fact named'},
    {at: 0.6, fn: "s.travelB > 0 && s.travelA === 0 && s.phaseA === 'rest' && s.insetProgress > 0", label: 'parallel: in B Party C pushes her card; in A it stays in her tray'},
    {at: 1, fn: "!s.slottedA && s.slottedB && s.travelA === 0 && s.insetProgress === 1 && s.guide === 1 && s.note === 1 && s.allReached && s.markPB === 1", label: 'guide: in B the card in the third slot, in A in her tray; the guide and the neutral note shown'},
    {at: 1, fn: 's.truncated.length === 0 && s.labelsClear && s.labelsOffFaces', label: 'layout: nothing cut; labels clear of each other, of the insets and of the people'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.slottedB && s.lookA.initial === 1 && s.lookB.requested === 1 && s.insetProgress === 1", label: 'labels hidden: the same contrast'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.labelsClear && s.allReached && s.slottedB && !s.slottedA', label: `${n}: nothing cut; labels clear; the hands reach`})),
  ],
});
identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.request, p.stages.initial, p.stages.requested, p.scenarioA.label, p.scenarioB.label, ...[p.scenarioA.caption, p.scenarioB.caption].filter(Boolean), p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean);",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// the three people of each room are drawn at the same scale (each rig's rendered vertical scale; hair styles differ, so
// head boxes are not compared)
const PORTRAITS_EQUAL = `(() => ['sa', 'sb'].every(P => { const ks = ['pa', 'pb', 'pc'].map(k => svg.querySelector('[data-node="' + P + '-' + k + '"]')).filter(Boolean).map(e => e.getScreenCTM().d); return ks.length === 3 && Math.max(...ks) / Math.min(...ks) < 1.001; }))()`;
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
// the one difference reads at every size: each inset's glyph is >= 24 px across at 1080p (A ●, B ◆); A one frame round
// two slots and Party C's card still in the tray lane, B one frame round three slots and the card in the third slot;
// no dashed mark
const INSETS_LEGIBLE = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('inset0-gl'), b = q('inset1-gl'), ma = q('inset0-marks'), mb = q('inset1-marks'), ca = q('inset0-c'), cb = q('inset1-c');
  if (!a || !b || !ma || !mb || !ca || !cb) return false;
  const big = e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) / K >= 24 && eff(e) > 0.9; };
  const fa = ma.querySelector('path').getBoundingClientRect(), fb = mb.querySelector('path').getBoundingClientRect();
  const rca = ca.getBoundingClientRect(), rcb = cb.getBoundingClientRect();
  const inside = (r, f) => r.left >= f.left - 1 && r.right <= f.right + 1 && r.top >= f.top - 1 && r.bottom <= f.bottom + 1;
  return big(a) && big(b) && a.querySelector('circle') && !b.querySelector('circle') && fb.height > fa.height * 1.3 && !inside(rca, fa) && inside(rcb, fb) && eff(ma) > 0.9 && eff(mb) > 0.9 && ![...svg.querySelectorAll('[data-node^="inset"] [stroke-dasharray]')].length;
})()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// the guide markers sit off every head and off every text they do not own
const MARKERS_CLEAR = `(() => {
  const R = e => e.getBoundingClientRect();
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const marks = [...svg.querySelectorAll('[data-node^="mark"]')].map(m => m.querySelector('circle')).filter(Boolean);
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"], [data-node$="-pc-head"]')];
  const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-node^="mark"]') && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  return marks.length === 2 && marks.every(m => heads.every(h => !meet(R(m), R(h))) && texts.every(t => !meet(R(m), R(t))));
})()`;
// every card stays drawn and opaque in both scenes at every sampled u, apart from the others and of the same size (each
// keeps its own label; the newcomer's card is drawn like the others; none is erased or merged)
const CARDS_KEPT = `(() => ['sa', 'sb'].every(P => { const fs = [...svg.querySelectorAll('[data-node^="' + P + '-f"][data-node$="-g"]')]; if (fs.length !== 3) return false;
  const rs = fs.map(e => e.getBoundingClientRect());
  return fs.every(e => { let o = 1; for (let x = e; x && x.tagName !== 'svg'; x = x.parentElement) { const a = x.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o > 0.99 && e.getBoundingClientRect().width > 2; })
    && rs.every(b => Math.abs(b.width - rs[0].width) < 1)
    && rs.every((a, i) => rs.every((b, j) => i === j || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 0.5)); }))()`;

ratioChecks(ID, 'two scenes, faces clear, in frame, figures readable, exactly one difference', [
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, header, strip item or text covers a head'},
  {at: [0.3, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (civil-claim measures the rendered HEAD box — SESSION_HANDOFF "PEOPLE-FLOOR MEASUREMENT CLARIFIED")
  {at: [0.1, 0.6, 1], presets: BASE, ratios: ['16:9', '9:16'], dom: headsAtLeast(60), label: 'heads >= 60 px at 16:9 and 9:16 in both scenes (non-stress)'},
  {at: [0.1, 0.6, 1], presets: BASE, ratios: ['1:1'], dom: headsAtLeast(55), label: 'heads >= 55 px at 1:1 in both scenes (non-stress)'},
  {at: [0.1, 0.6, 1], presets: ['long-labels-stress'], dom: headsAtLeast(45), label: 'stress: heads >= 45 px in both scenes'},
  {at: [1], dom: INSETS_LEGIBLE, label: 'RENDERED: the tray and the slots drawn large in both insets — glyphs >= 24 px across; A: ● one frame round two cards, the card in the tray; B: ◆ one frame round three, the card in the third slot (labels shown or hidden)'},
  {at: times(0, 1, 0.1), dom: CARDS_KEPT, label: 'LEGAL: every card stays drawn, opaque, apart and of the same size in both scenes (each keeps its own label)'},
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
  {at: [0.1, 1], dom: PORTRAITS_EQUAL, label: 'LEGAL: the three people of each room have the same size (the newcomer is drawn like the parties)'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

esDefaults(ID, [0.5, 1], '|only|frame|differ|Where|tray|place');

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.6, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person'},
]);
hiddenText(ID, [0, 0.3, 0.6, 1]);

ratioChecks(ID, 'no one-word lines', [
  {at: times(0, 1, 0.05), tv: ['all'], dom: NO_LONE_LINES, label: 'RENDERED: no wrapped title, chip, tag, plate, card or label has a one-word line (every 0.05; es-only too)'},
  {at: [0.3, 0.6, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: NO_LONE_LINES, label: 'RENDERED: es-only — no one-word line'},
]);
// the changed fact reads in each room: the configuration's frame (A round two cards, B round three) spans >= 85 px in
// each dimension at 1080p at the hold in the baseline presets, >= 70 px under long-labels-stress, every ratio (reviewer
// item 18: about 90 px at 1:1)
const changeLarge = min => `(() => { const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  return ['sa-mi', 'sb-mr'].every(n => { const e = svg.querySelector('[data-node="' + n + '"]'); if (!e) return false; const b = e.getBoundingClientRect(); return Math.min(b.width, b.height) / K >= ${min}; }); })()`;
ratioChecks(ID, 'changed fact large in each room', [
  {at: [1], presets: BASE, dom: changeLarge(85), label: 'RENDERED: the configuration frame in each room spans >= 85 px (1080p) in both dimensions'},
  {at: [1], presets: ['long-labels-stress'], dom: changeLarge(70), label: 'RENDERED: stress — the configuration frame spans >= 70 px in both dimensions'},
]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});
glyphGlue(ID);
ratioChecks(ID, 'people inside their rooms', [
  {at: times(0, 1, 0.05), dom: peopleInsideRooms(['sa', 'sb'], 3), label: 'RENDERED: every person, strokes included, stays >= 3 px inside its room’s walls (every 0.05; labels shown or hidden)'},
]);

// thin windows: the push lasts >= 600 ms, the glide >= 600 ms and the appearance of the configuration >= 400 ms
test(`${ID}: thin windows measured — configuration, push and glide`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  const rows = [];
  for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, timeMs: t}).semantic);
  expect(rows.filter(s => s.configShown > 0 && s.configShown < 1).length * 1000 / 60).toBeGreaterThanOrEqual(400);
  expect(rows.filter(s => s.phaseB === 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.travelA !== 0)).toEqual([]);
  expect(rows.filter(s => s.travelB > 0 && !s.slottedB && s.phaseB !== 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; A's card never moves; B's travel never decreases;
// each room shows only its own configuration; identical before the change beat
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.travelA, tag).toBe(0);
      expect(s.lookA.requested === 0 && s.lookB.initial === 0, tag).toBe(true);
      if (u < 0.17) expect(JSON.stringify(s.lookA), tag).toBe(JSON.stringify(s.lookB));
      expect(s.travelB >= prev - 1e-6, tag).toBe(true);
      prev = s.travelB;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
    }
  }
});
