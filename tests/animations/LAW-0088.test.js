// LAW-0088 — Analogía de casos · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens content is
// the same overlay drawn at the same coordinates and its source contains the
// focus slot), the change is local (only case B's value of the focus feature;
// every other feature keeps its kind), and seeking back restores the previous
// datum exactly.
import {contractSuite} from '../harness/contract.js';
import {ratioChecks, TEXT_CHECKS} from './analogia-ratio-checks.js';

contractSuite('LAW-0088', {
  // the supplied rule quotes end in a literal “…” (author text, not a cut);
  // real fit truncation is caught by the per-ratio TEXT_CHECKS (<title> test)
  allowTruncation: ['Where an item is lent', 'Cuando se presta'],
  continuity: ['bLens', 'bContext'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.contextKind === 'differs' && s.noteShown === 0 && s.marker === 0", label: 'build: the context shows the supplied overlay with the before datum; no lens, note or marker yet'},
    {at: 0.19, fn: "s.threads.every(q => q === 1) && s.threadKinds.every(k => k === 'relation') && s.threadArrows.every(a => a === false) && s.threadLands.every(d => d <= 1)", label: 'rule threads are plain relations (no arrowhead) that end on their ring'},
    {at: 0.42, fn: "s.lensOpen > 0.95 && s.datum === 'before' && s.lensKind === 'differs' && s.sourceContainsFocus && s.destClearOfSource", label: 'isolate: the lens is open on the unchanged slot; its source contains both prints of the focus feature and it opens in free space'},
    {at: 0.42, fn: 's.lensZoom >= 1.5', label: 'the lens really enlarges the slot'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensValue > 0 && s.lensValue < 1 && s.contextDatum === 'before' && s.contextKind === 'differs' && s.struck === 1", label: 'substitute: only the lens changes; the old value is struck through (still readable)'},
    {at: 0.74, fn: "s.datum === 'after' && s.lensKind === 'shared' && s.ghost && s.afterShown === 1 && s.contextDatum === 'before'", label: 'after the substitution the lens shows the prints coinciding and a dashed footprint of the old position'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.contextKind === 'shared' && s.contextText === 'Return date agreed' && s.marker === 1 && s.leader === 1 && s.leaderClean", label: 'return: the context shows the new datum with a changed-datum marker joined to the note by a leader that crosses no print or label'},
    {at: 1, fn: "JSON.stringify(s.otherKinds) === JSON.stringify(s.otherKindsAfter) && JSON.stringify(s.otherKinds) === JSON.stringify(['shared','shared','only-a'])", label: 'the change is local: every other feature keeps its supplied kind'},
    {at: 1, fn: "s.focusCaption === 'after' && s.outcome === null", label: 'the rule caption follows the supplied texts (similarity, as supplied); no outcome is drawn'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.datum === 'before' && s.lensValue === 0 && s.contextText === 'No return date agreed' && s.focusCaption === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {facts: [
      {icon: 'bicycle', a: 'Bicycle lent', b: 'Bicycle lent', relevant: true},
      {icon: 'clock', iconB: 'calendar', a: 'Kept for two days', b: 'Kept for two days', relevant: true},
    ], focusFeature: 1, beforeValue: 'Kept for two days', afterValue: 'Kept for one month'}, fn: "s.kindBefore === 'shared' && s.kindAfter === 'differs' && s.contextKind === 'differs' && s.focusCaption === 'after'", label: 'reverse substitution: a coinciding print lifts off and moves beside the earlier one'},
    {at: 1, params: {afterValue: 'No return date agreed either way'}, fn: "s.kindAfter === 'differs' && s.contextKind === 'differs' && s.focusCaption === 'unchanged' && s.contextText === 'No return date agreed either way'", label: 'a new value that still differs keeps the side-by-side geometry and the caption unchanged'},
    {at: 1, params: {focusFeature: 1, beforeValue: 'Loan noted on a slip', afterValue: ''}, fn: "s.kindBefore === 'shared' && s.kindAfter === 'only-a' && s.contextKind === 'only-a' && s.focusFeature === 1", label: 'an emptied value removes case B’s print (the feature is then in case A only)'},
    {at: 1, fn: "s.lensOpen === 0 && s.noteShown === 1 && s.struck === 1 && s.afterShown === 1 && s.marker === 1", label: 'return: the lens has closed; the note keeps the old value struck through beside the new one and the marker stays'},
    {at: 0.8, fn: "JSON.stringify(s.noteAt) !== 'null'", label: 'the note is present while the lens closes'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.datum === 'changing' && s.lensOpen === 1 && s.sourceContainsFocus", label: 'labels hidden: the same lens and substitution happen'},
    {at: 1, params: {cases: {a: {name: 'Case Quay Street'}, b: {name: 'Case Mill Lane'}}, facts: [
      {icon: 'bicycle', a: 'Bicycle lent to a friend', b: 'Bicycle lent to a friend', relevant: true},
      {icon: 'clock', iconB: 'calendar', a: 'Kept for two days', b: 'Kept for two days', relevant: true},
      {icon: 'phone', a: 'Loan agreed by message', b: 'Loan agreed by message', relevant: false},
      {icon: 'lock', a: '', b: 'Lock handed over too', relevant: false},
    ], focusFeature: 1, beforeValue: 'Kept for two days', afterValue: 'Kept for one month'}, fn: 's.marker === 1 && (s.leaderClean ? s.leader === 1 : s.leader === null)', label: 'a leader is drawn only when it can reach the note without crossing a print or label (otherwise the marker label acts as its legend)'},
  ],
});

// Per-ratio checks (every preset × 16:9 / 1:1 / 9:16).
ratioChecks('LAW-0088', [
  ...TEXT_CHECKS,
  {at: 1, fn: 's.threadMinGap === null || s.threadMinGap >= 30', label: 'the rule threads never run as a tight parallel pair'},
  {at: 1, fn: 's.threadHits === 0', label: 'no rule thread passes through another feature’s pictogram or another socket'},
  {at: 1, params: {textVisibility: 'none'}, fn: '(s.threadMinGap === null || s.threadMinGap >= 30) && s.threadHits === 0', label: 'labels hidden: threads stay separate and clear'},
]);
