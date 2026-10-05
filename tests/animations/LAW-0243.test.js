// LAW-0243 — Requerimiento previo · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (whether the reply slip
// comes back) and no legal consequence is invented (B just stays empty: no mark, no alarm, no outcome).
// Clock c = (u − 0.17) / 0.6 in both scenes: pen held c 0.07–0.37 → u 0.212–0.392; push c 0.42–0.47 →
// u 0.422–0.452; A's Party B holds the slip c 0.72–0.84 → u 0.602–0.674; the scenes differ from c 0.66 (u 0.566).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, textSizeOverTime, baselineTextAtHold, HANDS_OFF_HEADS, HEADS_OFF_TEXT} from './requerimiento-previo-checks.js';

const P = name => presetsFor('LAW-0243').find(q => q.name === name).params;

contractSuite('LAW-0243', {
  continuity: ['handA_A', 'handB_A', 'handA_B', 'handB_B', 'penA', 'letterA', 'letterB', 'slipA'],
  attach: [
    {from: 0.214, to: 0.39, a: 'penGripA', b: 'handA_A', tol: 1.5},
    {from: 0.423, to: 0.451, a: 'letterGripA', b: 'handA_A', tol: 1.5},
    {from: 0.603, to: 0.652, a: 'slipGripA', b: 'handB_A', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0 && s.changedShown === 0", label: 'base: two identical complete scenes; no scenario label or changed fact yet'},
    {at: 0.3, fn: "s.headers === 1 && JSON.stringify(s.lookA.docAt) === JSON.stringify(s.lookB.docAt) && s.a.slipAt === 'letter'", label: 'change beat: headers and the changed fact appear; both letters are still at Party A'},
    {at: 0.5, fn: "s.a.docAt === 'route' && s.b.docAt === 'route' && JSON.stringify(s.lookA.letter) === JSON.stringify(s.lookB.letter)", label: 'parallel: both letters slide identically'},
    {at: 0.62, fn: "s.a.slipAt === 'handB' && s.b.slipAt === 'letter' && s.a.calOpen === s.b.calOpen", label: 'only the reply differs: in A Party B tears off the slip; in B nothing is taken'},
    {at: 1, fn: "s.a.slipAt === 'pocketA' && s.a.pocketEmpty === 0 && s.a.markP === 1 && s.b.slipAt === 'letter' && s.b.pocketEmpty === 1 && s.b.markP === 0 && s.a.calOpen === 1 && s.b.calOpen === 1", label: 'hold: A’s pocket holds the slip on the supplied day; B’s pocket and slots stay empty (neutral)'},
    {at: 1, fn: 's.guide === 1 && s.neutralShown === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear', label: 'guide drawn, neutral note shown, nothing cut, labels clear'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.a.slipAt === 'pocketA' && s.b.slipAt === 'letter' && s.b.pocketEmpty === 1", label: 'labels hidden: the same difference is visible'},
    {at: 1, fn: "s.arrangement === 'row'", label: '16:9: the scenes stand side by side (their rendered share of the frame is checked per ratio below)'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached', label: `${n}: nothing cut, every hand reaches`})),
  ],
});

identicalBeforeChange('LAW-0243', 0.17);

suppliedTextSuite('LAW-0243', {
  fields: "const w = p.dates.window; const day = w[Math.max(0, Math.min(w.length - 1, p.dates.replyDay))]; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.letter.ref, p.documents.letter.title, p.dates.sent, p.documents.replySlip, ...w, p.stages.sent, p.stages.delivered, p.stages.replied + ' · ' + day, p.stages.pending, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const EQUAL_HEADERS = "['lab', 'cap'].every(k => { const a = svg.querySelector('[data-node=\"hA-' + k + '\"]'), b = svg.querySelector('[data-node=\"hB-' + k + '\"]'); if (!a && !b) return true; if (!a || !b) return false; return a.querySelectorAll('tspan').length === b.querySelectorAll('tspan').length && Math.abs(parseFloat(a.getAttribute('font-size')) - parseFloat(b.getAttribute('font-size'))) < 0.01; })";
// coordinator decision 2026-09-26 (standing stress rule, AUTHORING item 20): the long-labels-stress lengths of this item are
// capped to the longest values found to fit every ratio at >= 16 px without scaling (see the preset description in
// LAW-0243.presets.json for the capped fields and the measurements). No floor or limit in this file is relaxed.
// rendered: each scene's drawn width (the stage group, wall included) over the rendered frame's width, by arrangement
// (stacked full width: 0.82 of the frame = the former 0.9 of the caption-safe design width)
const SCENE_SHARE = `(() => {
  // the frame = the viewBox as drawn on screen (the svg element's own box may letterbox it)
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const F = {left: p0.x, right: p1.x, top: p0.y, bottom: p1.y, width: p1.x - p0.x, height: p1.y - p0.y};
  const sc = ['sa', 'sb'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean);
  if (sc.length !== 2) return false;
  const bs = sc.map(e => e.getBoundingClientRect());
  const row = Math.abs(bs[0].top - bs[1].top) < 2;
  const full = !row && bs.every(b => b.left - F.left < F.width * 0.12 && F.right - b.right < F.width * 0.12);
  const min = row ? 0.40 : full ? 0.82 : 0.55;
  return bs.every(b => b.width / F.width >= min);
})()`;
ratioChecks('LAW-0243', 'scenes large and equal, faces clear, cards own their text, in frame', [
  // (square frames may stack the scenes with the shared texts in a right-hand column, as LAW-0179/0191: the stacked
  // scenes then keep >= 0.55 of the frame width — AUTHORING item 20 layout threshold, coordinator 2026-09-26)
  {at: [1], dom: SCENE_SHARE, label: 'RENDERED share of the frame width: each scene >= 0.40 side by side, >= 0.55 stacked beside the text column, >= 0.82 stacked full width (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: EQUAL_HEADERS, label: 'A and B headers: same line counts and sizes (equal weight)'},
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, strip item, header or tag covers a head'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [0, 0.25, 0.45, 0.6, 0.75, 1], dom: IN_FRAME, label: 'nothing leaves the frame'},
  {at: [1], ratios: ['1:1'], presets: ['default', 'baseline-illustrative', 'baseline-es'], dom: headsAtLeast(55), label: 'baseline presets at 1:1: heads >= 55 px at 1080p (LAW-0171 precedent)'},
  {at: [1], dom: headsAtLeast(45), label: 'people readable in both scenes (head >= 45 px at 1080p: the stress contrast floor, LAW-0447)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-']), label: 'outcome tags beside their pockets (leader <= 40 px), leaders cross no text'},
  {at: [0, 0.3, 0.5, 0.7, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02: text, props, lens)'},
  {at: times(0.1, 0.62, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the pen and the hands never lie over a head (signing, pushing, tearing off the slip)'},
  {at: times(0.1, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.labelsOffFaces', label: 'layout: labels clear of faces'},
]);

// every visible text >= 16 px at every sampled u (coordinator rule, AUTHORING 'text size at every moment')
textSizeOverTime('LAW-0243', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0243')], test, expect});

// baseline presets, baseline-es included, keep every text >= 19.5 px at the hold in every ratio (coordinator 2026-09-26)
baselineTextAtHold('LAW-0243', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0243')], test, expect});
