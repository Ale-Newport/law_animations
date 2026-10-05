// LAW-0128 — Definición legislativa · inspect. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';
import {motifChecks} from './definicion-legislativa-checks.js';

contractSuite('LAW-0128', {
  continuity: ['pinA', 'pinB', 'lensCentre'],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.linkedRow === 2 && s.cordShown", label: 'build: the linked state (term pinned to entry row 2), no lens yet'},
    {at: 0.42, fn: "s.lensOpen > 0.95 && s.lensValue === 'before' && Math.abs(s.lensCentre.x - s.sourceInLens.x) < 0.6 && Math.abs(s.lensCentre.y - s.sourceInLens.y) < 0.6", label: 'isolate: the lens shows the real copy mapped from the source coordinates (source centre lands on the lens centre)'},
    {at: 0.66, fn: "s.lensValue === 'after' && s.oldStruck && s.datum === 'before' && s.linkedRow === 2", label: 'substitute: the new value appears in the lens, the old one is struck through; the context is unchanged yet'},
    {at: 0.9, fn: "s.datum === 'after' && !s.lensVisible && s.contextValue === 'register'", label: 'return: the context shows the new value once the lens has closed onto its source'},
    {at: 1, fn: "s.datum === 'after' && s.linkedRow === 3 && s.rowHl[2] === 1 && s.rowHl[1] === 0 && s.marker === 1 && s.allReached", label: 'only the dependent connection changes: the cord re-pins to the entry listing the new term; a marker stays'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextValue === 'listed item' && s.linkedRow === 2 && s.rowHl[1] === 1 && s.marker === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: {entryRows: {before: 2, after: 0}, afterValue: 'stored object'}, fn: "s.linkedRow === 0 && !s.cordShown && s.rowHl.every(v => v === 0)", label: 'a new term listed by no entry: the cord keeps no far end, no entry is lit'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.linkedRow === 3 && s.marker === 1", label: 'the substitution completes identically with labels hidden (non-text marker badge)'},
  ],
});

// Review B007 rounds 1–2 — defect classes fixed, checked for every preset × ratio, labels shown and hidden:
//  * a second magnifier (same handle) appeared over the term while the desk magnifier stayed parked:
//    the enlargement is a handle-less rectangular inset, so the desk magnifier is the only magnifier,
//    and it rests in a free corner (clear of documents, plate and inset);
//  * the long-label lens showed mid-word fragments: the inset's source holds both terms whole;
//  * round 2: supplied text was drawn as bars or under 16 px (references, level names, headings,
//    entries, the old entry's wording): the context is drawn as readable documents sized to their
//    text; every supplied field is visible text at >= 16 px;
//  * round 3: the parked magnifier's handle was cut off at the desk edge; the swap badge covered the
//    first letter of the line above the term; at 9:16 the marker's leader ran 8-12 px beside the cord;
//    the inset flew back across the page's reference line and left a fading duplicate pin: the
//    magnifier lies wholly on the desk, the badge sits in the extract's margin, the leader keeps
//    >= 30 px from any parallel run of the cord, and the inset opens and closes where it stands;
//  * round 4: the ending was rushed (final state ~0.16 s): the return ends by u 0.80 and the marker
//    by u 0.84, so the complete state holds ~1.3 s; the changed marker is a neutral Δ on accent2.
const FIELDS_HOLD = `[P.passages[0].ref, P.passages[0].heading, P.passages[1].ref, P.passages[1].heading, P.passages[1].text, ...P.hierarchy, P.beforeValue, P.afterValue, P.contextLabels.context, P.contextLabels.marker]`;
const FIELDS_BUILD = `[P.passages[0].ref, P.passages[0].heading, P.passages[0].text, P.passages[1].ref, P.passages[1].heading, P.passages[1].text, ...P.hierarchy, P.beforeValue, P.contextLabels.context]`;
motifChecks('LAW-0128', 'single magnifier, whole words in the inset, supplied text >= 16 px', [
  ...[0.1, 0.3, 0.42, 0.55, 0.66, 0.8, 0.88, 1].map(at => ({at, dom: {kind: 'nodeCount', re: '(^|-)handle$', n: 1}, label: 'exactly one magnifier handle is visible (the desk prop)'})),
  {at: 0.42, fn: "s.lensInset && s.lensWordsWhole && s.lensZoom >= 1.2 && s.lensOpen > 0.95", dom: {kind: 'lensWords', content: 'lens-content', source: 's.sourceRect'}, label: 'isolate: the inset shows the whole before-term, magnified'},
  {at: 0.66, fn: "s.lensWordsWhole && s.lensValue === 'after'", dom: {kind: 'lensWords', content: 'lens-content', source: 's.sourceRect'}, label: 'substitute: the inset shows the whole after-term'},
  {at: 0.42, tvs: ['all'], dom: {kind: 'lensHas', content: 'lens-content', text: 'P.beforeValue'}, label: 'isolate: the before-term is text in the inset'},
  {at: 0.66, tvs: ['all'], dom: {kind: 'lensHas', content: 'lens-content', text: 'P.afterValue'}, label: 'substitute: the after-term is text in the inset'},
  {at: 1, fn: "s.annInsideDesk && s.magnifierClear", label: 'the annotation plate stays on the desk; the parked magnifier keeps clear of the documents, plate and inset'},
  {at: 0.15, tvs: ['all'], dom: {kind: 'fieldsText', min: 16, fields: FIELDS_BUILD}, label: 'build: every supplied field (incl. the article clause) is visible TEXT at >= 16 px'},
  {at: 1, tvs: ['all'], dom: {kind: 'fieldsText', min: 16, fields: FIELDS_HOLD}, label: 'hold: every supplied field is visible TEXT at >= 16 px'},
  {at: 1, tvs: ['all'], presets: ['contrast-or-alternative'], dom: {kind: 'minPx', nodes: ['noentry-g'], min: 16}, label: 'the no-entry tag reads at >= 16 px'},
  ...[0.1, 0.5, 1].map(at => ({at, dom: {kind: 'within', nodes: ['mag-handle', 'mag-rim', 'mag-shadow'], box: 'desk-surface'}, label: 'the parked magnifier (rim, handle, shadow) lies wholly on the desk'})),
  {at: 1, fn: "s.magnifierInside && s.magnifierClear", label: 'the magnifier fits inside the desk and keeps clear of the documents, plate and inset'},
  {at: 1, dom: {kind: 'clearOfText', node: 'badge'}, label: 'the changed-datum badge covers no word'},
  {at: 1, fn: "s.leaderCordGapPx === null || s.leaderCordGapPx >= 30", label: "the marker's leader never runs within 30 px beside the cord"},
  ...[0.3, 0.42, 0.6, 0.76, 0.78, 0.8, 0.82, 0.84].map(at => ({at, dom: {kind: 'clearOfText', node: 'lens-rim', except: 'lens'}, label: 'the inset (opening, open, closing) covers no text of the documents'})),
  ...[0.3, 0.76, 0.8, 0.84].map(at => ({at, fn: "Math.abs(s.lensCentre.x - s.sourceInLens.x) < 0.6 && Math.abs(s.lensCentre.y - s.sourceInLens.y) < 0.6", label: 'the inset stays at its place while it opens and closes (it never travels across the documents)'})),
  // round 4: the ending is not rushed — the return and the marker are complete 1 s before the end
  {at: 'hold', dom: {kind: 'holdsToEnd'}, label: 'the complete final state (re-pinned cord, new term, marker, plate) holds unchanged for the last 1 s'},
  {at: 'hold', fn: "s.datum === 'after' && s.marker === 1 && !s.lensVisible", label: 'at 1 s before the end the swap, the re-pin and the marker are complete'},
]);
