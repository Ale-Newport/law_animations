// LAW-0247 — Preparación de demanda · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (whether one configured section's
// piece is supplied) and no legal consequence is invented (B's section just stays a neutral empty slot).
// Clock c = (u − 0.40) / 0.37 in both scenes (the hand leaves the counter from c = −0.12, u 0.356). Both scenes push the
// shared pieces bottom row first and the changed piece last (default changed section 2: cards 1, 0, 2). Push windows:
// slot 0 u 0.433–0.452, slot 1 u 0.537–0.556, slot 2 u 0.640–0.659. Flaps fold 0.27–0.36; the scenes differ from the
// flaps (u 0.27: B's changed tray is empty). Tags 0.78–0.84, guide 0.80–0.86, note 0.83–0.89, hold from 0.89.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, textSizeOverTime,
  baselineTextAtHold, HANDS_OFF_HEADS, HEADS_OFF_TEXT, labelsOffProps, contentShare, pathsOffText, coverageOverTime, playedVsSeek, coldCreate, armsOffTextOverTime,
  NO_SPLIT_TOKENS, LEADS_WITH_CHIPS,
} from './preparacion-demanda-checks.js';

const ID = 'LAW-0247';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const PROPS = ['sa', 'sb'].flatMap(s => ['pa', 'pa-nw', 'frame', 'sheet', 'trays', 'lips', 'card0', 'card1', 'card2', 'cfg', 'counter', 'flap0', 'flap1', 'flap2'].map(n => `${s}-${n}`)).concat(['sa-root', 'sb-root'].map(() => null)).filter(Boolean);
const CONTENT = ['sa-pa', 'sa-frame', 'sa-sheet', 'sa-trays', 'sa-cfg', 'sa-counter', 'sb-pa', 'sb-frame', 'sb-sheet', 'sb-trays', 'sb-cfg', 'sb-counter', 'hdr0', 'hdr1', 'bt-changed', 'bt-strip0', 'bt-strip1', 'bt-strip2', 'bt-strip3', 'bt-strip4', 'bt-strip5', 'bt-strip6', 'bt-strip7', 'bt-strip8'];

contractSuite(ID, {
  continuity: ['handA_A', 'handA_B', 'cardA0', 'cardA1', 'cardA2', 'cardB0', 'cardB1'],
  attach: [
    {from: 0.434, to: 0.451, a: 'gripA1', b: 'handA_A', tol: 1.5},
    {from: 0.538, to: 0.555, a: 'gripA0', b: 'handA_A', tol: 1.5},
    {from: 0.641, to: 0.658, a: 'gripA2', b: 'handA_A', tol: 1.5},
    {from: 0.434, to: 0.451, a: 'gripB1', b: 'handA_B', tol: 1.5},
    {from: 0.538, to: 0.555, a: 'gripB0', b: 'handA_B', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0 && s.changedShown === 0 && s.flap === 0", label: 'base: two identical scenes, trays covered, no scenario label or changed fact yet'},
    {at: 0.3, fn: 's.headers === 1 && s.flap > 0 && s.a.filled === 0 && s.b.filled === 0', label: 'change beat: headers shown, the flaps fold down, nothing has moved yet'},
    {at: 0.5, fn: 'JSON.stringify(s.a.landed) === JSON.stringify(s.b.landed) && s.a.filled === 1', label: 'parallel: the first piece lands in both scenes alike'},
    {at: 1, fn: "s.a.filled === 3 && s.b.filled === 2 && !s.b.landed[s.changedSection] && s.a.landed[s.changedSection]", label: 'hold: only the configured section differs (filled in A, an empty slot in B)'},
    {at: 1, fn: 's.guide === 1 && s.tags === 1 && s.neutralShown === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear && s.fitted', label: 'guide, tags and neutral note shown; nothing cut; labels clear'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.a.filled === 3 && s.b.filled === 2', label: 'labels hidden: the same difference is visible'},
    {at: 1, params: {changedSection: 0}, fn: 's.a.filled === 3 && s.b.filled === 2 && !s.b.landed[0]', label: 'a different changed section is followed as supplied'},
    {at: 1, fn: "s.arrangement === 'row'", label: '16:9: the scenes stand side by side'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached && s.labelsClear && s.fitted', label: `${n}: nothing cut, every hand reaches, labels clear, fitted`})),
  ],
});

// the scenes differ from the flaps (u 0.27); everything before is identical (labels shown and hidden)
identicalBeforeChange(ID, 0.27);

suppliedTextSuite(ID, {
  fields: "const k = p.changedSection; return [p.parties[0].name, p.parties[1].name, p.parties[0].role, p.parties[1].role, p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.ref, p.documents.filing.title, ...p.sections.map(s => s.heading), ...p.sections.map(s => s.item), p.dates.filing, p.dates.calendar, p.labels.calendar, p.stages.pending, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// RENDERED share of the FRAME width of each scene's stage (person, frame, filing, case file, counter): side by side
// >= 0.40, stacked >= 0.71 (coordinator thresholds 2026-09-26)
const SCENE_SHARE = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const FW = p1.x - p0.x;
  const box = s => { const bs = ['pa', 'frame', 'cfg', 'counter'].map(n => svg.querySelector('[data-node="' + s + '-' + n + '"]')).filter(Boolean).map(e => e.getBoundingClientRect()); return {l: Math.min(...bs.map(b => b.left)), r: Math.max(...bs.map(b => b.right)), t: Math.min(...bs.map(b => b.top))}; };
  const a = box('sa'), b = box('sb');
  const row = Math.abs(a.t - b.t) < 4;
  return [a, b].every(q => (q.r - q.l) / FW >= (row ? 0.40 : 0.71));
})()`;
const EQUAL_HEADERS = "['lab', 'cap'].every(k => { const a = svg.querySelector('[data-node=\"hdr0-' + k + '\"]'), b = svg.querySelector('[data-node=\"hdr1-' + k + '\"]'); if (!a && !b) return true; if (!a || !b) return false; return Math.abs(parseFloat(a.getAttribute('font-size')) - parseFloat(b.getAttribute('font-size'))) < 0.01; }) && (() => { const a = svg.querySelector('[data-node=\"hdr0\"]'), b = svg.querySelector('[data-node=\"hdr1\"]'); if (!a) return true; const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return Math.abs(ra.width - rb.width) < 1 && Math.abs(ra.height - rb.height) < 1; })()";
ratioChecks(ID, 'scenes large and equal, faces and hands clear, labels off props, in frame', [
  {at: [0, 0.5, 1], dom: NO_SPLIT_TOKENS, label: 'RENDERED: no reference or word is broken across lines (no hyphen break, no 1–2 character line)'},
  {at: [0.3, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].map(x => x.textContent).join(' '); return !/Party A|Party B|Case file|Written claim|Delivery note|as supplied|Only whether|Every piece|Filing complete|Section to complete|The filing as assembled|Changed datum/.test(t) && /Parte A|Expediente/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
  // (labels hidden: the text strip is gone and the two scenes grow into the space — 1:1 stacks them full width)
  {at: [0, 1], tv: ['none'], dom: contentShare(['sa-pa', 'sa-frame', 'sa-cfg', 'sa-counter', 'sb-pa', 'sb-frame', 'sb-cfg', 'sb-counter'], 0.8, 0.4), label: 'RENDERED: labels hidden — the two scenes together span >= 0.80 of the frame width and >= 0.40 of its height'},
  {at: [0, 1], tv: ['none'], ratios: ['1:1'], dom: contentShare(['sa-pa', 'sa-frame', 'sa-cfg', 'sa-counter', 'sb-pa', 'sb-frame', 'sb-cfg', 'sb-counter'], 0.8, 0.6), label: 'RENDERED: labels hidden at 1:1 — the scenes fill the freed space (>= 0.80 of the width, >= 0.60 of the height)'},
  {at: [0, 1], dom: SCENE_SHARE, label: 'RENDERED: each scene >= 0.40 of the frame width side by side, >= 0.71 stacked (rest and hold, labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: EQUAL_HEADERS, label: 'A and B headers: same sizes (equal weight)'},
  {at: [1], ratios: ['1:1'], presets: ['default', 'baseline-illustrative', 'baseline-es'], dom: headsAtLeast(55), label: 'baseline presets at 1:1: heads >= 55 px at 1080p (coordinator floor)'},
  {at: [1], dom: headsAtLeast(45), label: 'people readable in both scenes (head >= 45 px at 1080p: the stress contrast floor)'},
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, header or tag covers a head'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [1], tv: ['all'], dom: pathsOffText('guide'), label: 'RENDERED: the dotted guide (outline → gutter → tags → guide label) crosses no text'},
  {at: [0.3, 1], tv: ['all'], dom: labelsOffProps(PROPS), label: 'RENDERED: no tag, chip, header or key lies over a prop, a person or text it does not own'},
  {at: times(0, 1, 0.02), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: times(0.34, 0.8, 0.01), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head'},
  {at: times(0, 1, 0.02), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.labelsOffFaces && s.labelsClear', label: 'layout: labels clear of each other and of the faces'},
]);

textSizeOverTime(ID, {presets: ALL, test, expect});
baselineTextAtHold(ID, {presets: ALL, test, expect});
// (the drawn room — each scene's wall — counts as content, as the room does in the LAW-0228 precedent)
coverageOverTime(ID, {groups: [...CONTENT, 'sa-wall', 'sb-wall'], presets: ALL, test, expect});
playedVsSeek(ID, {presets: ALL, test, expect});
coldCreate(ID, {presets: ALL, test, expect});
// (whole arms, 60 fps: a crossing may last at most 300 ms — the alternative's changed middle piece waits in its tray
// while the arm pushes the top piece, about 50 ms over its number disc)
armsOffTextOverTime(ID, {presets: ALL, maxMs: 300, test, expect});
