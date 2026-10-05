// LAW-0249 — Presentación de demanda · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (pen, filing and stamp ride SOLVED hand
// positions) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65 (c = 1 at u = 0.80). Windows (c → u):
//   pen held c 0.07–0.37 → u 0.1955–0.3905; signing c 0.13–0.30 → u 0.2345–0.345;
//   push (hand on the filing's left edge) c 0.42–0.47 → u 0.423–0.4555; the filing lands c 0.62 → u 0.553;
//   the clerk holds the stamp c 0.68–0.93 → u 0.592–0.7545 (press c 0.76–0.80 → u 0.644–0.67); the reference
//   appears c 0.80–0.82 → u 0.67–0.683 (after the press: cause before effect); entry glyph c 0.82–0.90.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, tagsOffProps, TEXT_LINES_VISIBLE} from './presentacion-demanda-checks.js';

const ID = 'LAW-0249';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const near = (a, b, tol = 1.5) => `Math.hypot(s.${a}.x - s.${b}.x, s.${a}.y - s.${b}.y) < ${tol}`;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['handA', 'handB', 'pen', 'letter', 'stamp'],
  attach: [
    {from: 0.197, to: 0.389, a: 'penGrip', b: 'handA', tol: 1.5},
    {from: 0.236, to: 0.344, a: 'pen', b: 'sigTip', tol: 1.5},
    {from: 0.424, to: 0.455, a: 'letterGrip', b: 'handA', tol: 1.5},
    {from: 0.593, to: 0.754, a: 'stampGrip', b: 'handB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.docAt === 'A' && s.sig === 0 && !s.penHeld && s.refShown === 0 && s.markP === 0 && s.stampAt === 'pad' && s.tags.sent === 0 && s.tags.outcome === 0", label: 'rest: the unsigned filing stands at Party A, its reference box blank, the stamp on its pad'},
    {at: 0.3, fn: `s.penHeld && s.sig > 0 && s.sig < 1 && ${near('pen', 'sigTip')}`, label: 'Party A signs: the pen nib is on the signature stroke'},
    {at: 0.44, fn: `s.docAt === 'A' && ${near('letterGrip', 'handA')}`, label: 'Party A pushes the filing by its edge'},
    {at: 0.5, fn: "s.docAt === 'route' && s.refShown === 0 && s.trayLit === 0", label: 'the filing slides along the counter track; nothing is registered yet'},
    {at: 0.6, fn: "s.docAt === 'registry' && s.landed && s.stampAt === 'carried' && s.refShown === 0", label: 'in the intake tray; the clerk carries the stamp; the reference box is still blank'},
    {at: 0.66, fn: `s.stampAt === 'pressing' && s.refShown === 0 && ${near('stampGrip', 'handB')}`, label: 'the stamp presses the box; the reference is not shown before the press ends (cause before effect)'},
    {at: 0.69, fn: 's.referenced && s.refShown === 1', label: 'after the press the supplied reference is in the box'},
    {at: 1, fn: "s.docAt === 'registry' && s.referenced && s.stampAt === 'pad' && s.markP === 1 && s.tags.outcome === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear", label: 'hold: registered with the reference, the entry glyph on the supplied day, stamp back, nothing cut'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.docAt === 'registry' && s.referenced && s.markP === 1", label: 'labels hidden: the same transformation is visible (filing in the intake tray, reference box stamped, entry glyph)'},
    {at: 1, params: {finalState: 'draft-not-filed'}, fn: "s.docAt === 'A' && !s.landed && s.refShown === 0 && s.markP === 0 && s.stampAt === 'pad' && s.sig === 1 && s.tags.sent === 0 && s.tags.outcome === 1", label: 'draft, not filed (as supplied): signed, stays at Party A, box blank, no entry, clerk still'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.docAt === 'A' && s.tags.outcome === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0.6, fn: 's.tags.outcome === 0 && s.markP === 0', label: 'no outcome is shown before the stamp'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached', label: `${n}: no supplied text is cut; every hand reaches its target`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const reg = p.finalState !== 'draft-not-filed'; const w = p.dates.window; const day = w[Math.max(0, Math.min(w.length - 1, p.dates.entryDay))]; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.title, p.documents.filing.dated, ...(reg ? [p.documents.reference, p.stages.sent, p.stages.registered + ' · ' + day] : [p.stages.draft]), ...w, p.objectLabels.calendar, p.objectLabels.intake, p.objectLabels.drafts, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const STAGE_WIDE = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const st = svg.querySelector('[data-node="st"]');
  return Boolean(st) && st.getBoundingClientRect().width >= 0.71 * (p1.x - p0.x);
})()`;
const TAGS_OFF_PROPS = tagsOffProps(['st-cf', 'st-cal', 'st-tray-back', 'st-tray-front', 'st-letter', 'st-stamp', 'st-pen', 'st-dplate']);
// the "no directed arrows" rule: no arrowhead markers, no chevron paths on the stage
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;

ratioChecks(ID, 'faces clear, cards own their text, in frame, people large, tags beside their elements', [
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or text covers a head'},
  {at: [0, 0.35, 0.6, 0.7, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [1], dom: headsAtLeast(52), label: 'people are large enough to read (head >= 52 px at 1080p)'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box at rest and hold (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-', 'note']), label: 'each tag sits beside its own element (leader <= 40 px) and its leader crosses no text'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.7, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers (the draft state is neutral)'},
  {at: [0, 1], dom: NO_ARROWS, label: 'no arrowhead markers'},
  {at: [0.56, 0.6, 0.64, 0.78, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no stage tag intersects any prop or any text (when each tag appears and at the hold)'},
  {at: [1], ratios: ['9:16'], presets: ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'], dom: STAGE_WIDE, label: 'RENDERED: 9:16 baseline presets keep the stacked stage (no text column), >= 0.71 of the frame width'},
  {at: [1], presets: ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'], fn: '!s.textColumn', label: 'baseline and contrast presets: no text-column fallback in any ratio'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.1, 0.8, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the pen, the stamp and the hands never lie over a head'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.labelsOffFaces && s.labelsClear', label: 'layout: labels clear of each other and of the faces'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

// with only locale "es", every default text is shown in Spanish: no English default remains (review r2)
ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' '); return !/\\b(Party|Registry|Day \\d|fictional|Case file|Written|Handed|Registered|Draft|supplied|Reference|Sequence|Filing|Same in|Changed fact|Before|After|Datum)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

// every line of every visible label is drawn whole and on top (review r2: a tray label's second line hid behind the desk)
ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop, the counter or a person'},
]);
