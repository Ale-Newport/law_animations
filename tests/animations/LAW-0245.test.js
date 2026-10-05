// LAW-0245 — Preparación de demanda · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (each card rides the SOLVED hand position while it
// is pushed) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.58 (c = 1 at u = 0.73). Cards are pushed bottom row first (card 2, 1, 0 — so the arm, whose
// elbow bends below the shoulder → hand line, is never drawn over a card still waiting in its tray). Slot s occupies
// c [0.28s, 0.28s + 0.28]: push c 0.28s + [0.0896, 0.14] → slot 0 (card 2) u 0.202–0.231, slot 1 (card 1) u 0.365–0.394,
// slot 2 (card 0) u 0.527–0.556; slot s lands at c 0.28s + 0.2688 → u 0.306, 0.469, 0.631. Tag 0.74–0.80, callouts
// 0.78–0.84, hold from 0.84.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, textSizeOverTime,
  baselineTextAtHold, HANDS_OFF_HEADS, HEADS_OFF_TEXT, HANDS_OFF_TEXT, labelsOffProps, contentShare, coverageOverTime,
  playedVsSeek, coldCreate, armsOffTextOverTime,
  NO_SPLIT_TOKENS, LEADS_WITH_CHIPS,
} from './preparacion-demanda-checks.js';

const ID = 'LAW-0245';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const PROPS = ['st-pa', 'st-nw', 'st-pa-nw', 'st-frame', 'st-sheet', 'st-trays', 'st-lips', 'st-card0', 'st-card1', 'st-card2', 'st-cfg', 'st-cal', 'st-counter'];
const CONTENT = ['st-pa', 'st-frame', 'st-sheet', 'st-trays', 'st-cfg', 'st-cal', 'st-counter'];
// (the width share is measured WITHOUT the counter and the wall, which span the whole scene: person, frame, filing,
// case file and calendar only)
const SHARE = ['st-pa', 'st-frame', 'st-sheet', 'st-trays', 'st-cfg', 'st-cal'];

contractSuite(ID, {
  continuity: ['handA', 'card0', 'card1', 'card2'],
  attach: [
    {from: 0.203, to: 0.23, a: 'grip2', b: 'handA', tol: 1.5},
    {from: 0.366, to: 0.393, a: 'grip1', b: 'handA', tol: 1.5},
    {from: 0.528, to: 0.555, a: 'grip0', b: 'handA', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: 's.filled === 0 && s.pushing === -1 && s.tag === 0 && s.notes === 0', label: 'rest: three pieces in their trays, every section an empty slot, no tag yet'},
    {at: 0.215, fn: 's.pushing === 2 && Math.hypot(s.grip2.x - s.handA.x, s.grip2.y - s.handA.y) < 1.5', label: 'Party A pushes the first piece (the bottom tray) by its edge'},
    {at: 0.4, fn: 's.landed[2] && !s.landed[1] && !s.landed[0]', label: 'the first piece is in its section before the second lands (one at a time)'},
    {at: 0.7, fn: 's.filled === 3 && s.tag === 0', label: 'every piece has landed before the state tag appears (cause before effect)'},
    {at: 1, fn: 's.filled === 3 && s.tag === 1 && s.notes === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear && s.fitted', label: 'hold: all sections filled, tag and callout shown, nothing cut, labels clear'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.filled === 3 && s.landed.every(Boolean)', label: 'labels hidden: the same transformation (three pieces in three sections)'},
    {at: 1, params: {finalState: 'section-pending', pendingSection: 2}, fn: 's.filled === 2 && !s.landed[2] && !s.supplied[2] && s.tag === 1 && s.allReached', label: 'section pending (as supplied): the third section stays an empty slot'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.filled === 1 && s.tag === 0', label: 'actionProgress freezes the action part-way'},
    {at: 0.3, fn: 's.tag === 0 && s.notes === 0', label: 'seeking back: no tag or callout before the hold'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached && s.labelsClear', label: `${n}: nothing cut; the hand reaches every card; labels clear`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const pend = p.finalState === 'section-pending'; return [p.parties[0].name, p.parties[1].name, p.parties[0].role, p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.ref, p.documents.filing.title, ...p.sections.map(s => s.heading), ...p.sections.filter((s, i) => !pend || i !== p.pendingSection).map(s => s.item), p.dates.filing, p.dates.calendar, pend ? p.stages.pending : p.stages.filled, p.objectLabels.calendar, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

ratioChecks(ID, 'faces, hands, labels off props, in frame, people large, scene fills the frame', [
  {at: [0, 0.5, 1], dom: NO_SPLIT_TOKENS, label: 'RENDERED: no reference or word is broken across lines (no hyphen break, no 1–2 character line)'},
  {at: [0.3, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].map(x => x.textContent).join(' '); return !/Party A|Party B|Case file|Written claim|Delivery note|as supplied|Only whether|Every piece|Filing complete|Section to complete|The filing as assembled|Changed datum/.test(t) && /Parte A|Expediente/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
  {at: times(0.74, 0.9, 0.004), dom: LEADS_WITH_CHIPS, label: 'RENDERED: every leader line appears with its own chip, never before it'},
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or text covers a head'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [1], dom: headsAtLeast(52), label: 'RENDERED: people large (head >= 52 px at 1080p, the civil-claim story floor)'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box at rest and at the hold (labels shown or hidden)'},
  // (coordinator thresholds 2026-09-26, shares of the FRAME: a full-width scene >= 0.71; beside the fallback text column >= 0.55)
  {at: [0, 1], dom: `(svg.querySelector('[data-node="coltx0"]') ? ${contentShare(SHARE, 0.55)} : ${contentShare(SHARE, 0.71)})`, label: 'RENDERED: the stage content (person, frame, filing, trays, case file, calendar; not the counter or wall) spans >= 0.71 of the FRAME width (>= 0.55 beside the fallback text column) at rest and hold'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-', 'note']), label: 'each tag / callout sits beside its own element (leader <= 40 px) and its leader crosses no text'},
  {at: [0.8, 1], tv: ['all'], dom: labelsOffProps(PROPS), label: 'RENDERED: no tag, callout, name chip or key lies over any drawn part of a prop or person, or over text it does not own'},
  {at: times(0, 1, 0.02), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: times(0.1, 0.75, 0.01), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head'},
  {at: times(0, 1, 0.01), dom: HANDS_OFF_TEXT, label: 'RENDERED: no arm (hand, forearm, upper arm) is drawn over visible text (pushing the edge, never the printed text)'},
  {at: times(0, 1, 0.02), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.labelsOffHead && s.labelsClear', label: 'layout: labels clear of each other and of the head'},
]);

// every visible text >= 16 px at every sampled u (coordinator rule, AUTHORING 'text size at every moment')
textSizeOverTime(ID, {presets: ALL, test, expect});
// baseline presets, baseline-es included, keep every text >= 19.5 px at the hold in every ratio (coordinator 2026-09-26)
baselineTextAtHold(ID, {presets: ALL, test, expect});
// (the fallback text column, when used, is content too — LAW-0228 counts its panel)
coverageOverTime(ID, {groups: [...CONTENT, 'st-wall', ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => `coltx${i}`)], presets: ALL, test, expect});
playedVsSeek(ID, {presets: ALL, test, expect});
coldCreate(ID, {presets: ALL, test, expect});
// (whole arms, 60 fps: logged per preset × ratio; any crossing <= 300 ms, on top of the per-sample check above)
armsOffTextOverTime(ID, {presets: ALL, maxMs: 300, test, expect});
