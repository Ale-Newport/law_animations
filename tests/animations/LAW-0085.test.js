// LAW-0085 — Analogía de casos · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchoring (the hand holds B's
// edge while carrying it, then the magnifier's handle) and a transformation
// that stays recognizable with labels hidden (B lands on A's pegs; shared
// prints coincide; differing variants stay apart).
import {contractSuite} from '../harness/contract.js';
import {ratioChecks, TEXT_CHECKS} from './analogia-ratio-checks.js';

contractSuite('LAW-0085', {
  // the supplied rule quotes end in a literal “…” (author text, not a cut);
  // real fit truncation is caught by the per-ratio TEXT_CHECKS (<title> test)
  allowTruncation: ['Where an item is lent', 'Cuando se presta'],
  continuity: ['hand', 'gripB', 'sheetB', 'lens', 'magGrip'],
  attach: [
    // the hand pinches B's lower edge from the lift until release on the pegs
    {from: 0.162, to: 0.42, a: 'hand', b: 'gripB', tol: 1},
    // then it holds the magnifier's handle from the pick-up until it lets go
    {from: 0.612, to: 0.71, a: 'hand', b: 'magGrip', tol: 1},
  ],
  semantic: [
    {at: 0, fn: "s.holderB === 'desk' && !s.landed && s.mergeState.every(m => m === 'apart') && s.badgesShown === 0 && !s.magHeld && s.threads.every(q => q === 0)", label: 'rest: B lies on the desk, nothing merged, no badge, magnifier resting'},
    {at: 0.14, fn: "s.holderB === 'desk' && s.registration > 100", label: 'nothing is lifted before the action beat'},
    {at: 0.3, fn: "s.holderB === 'hand' && !s.landed && s.mergeState.every(m => m === 'apart') && s.badgesShown === 0", label: 'carry: B is in the hand; no coincidence is shown before B lands'},
    {at: 0.3, fn: 's.hiddenALabels >= 1', label: 'A’s labels vanish under the tracing paper as B passes over them (no text over text)'},
    {at: 0.44, fn: "s.landed && s.registration < 0.5 && s.holderB === 'registered'", label: 'B lands on A’s pegs: the corner crosshairs coincide'},
    {at: 0.6, fn: "s.mergeState.length === s.kinds.filter(k => k === 'shared').length && s.mergeState.every(m => m === 'merged')", label: 'every shared feature (identical supplied text) coincides — and only those'},
    {at: 0.6, fn: "s.badgesShown === s.kinds.filter(k => k !== 'none').length && s.throughShown === 1", label: 'differing and single-case features stay visible with a badge; A’s own prints show through'},
    {at: 0.6, fn: "JSON.stringify(s.kinds) === JSON.stringify(['shared','shared','differs','only-a'])", label: 'kinds follow the supplied texts (shared / differs / only in A)'},
    {at: 1, fn: 's.magHeld && s.lensOver === s.relDiff && s.relDiff === 2', label: 'the magnifier rests over the relevant difference (as supplied)'},
    {at: 1, fn: "s.threads.every(q => q === 1) && s.threadKinds.every(k => k === 'relation') && s.threadArrows.every(a => a === false) && s.threadLands.every(d => d <= 3)", label: 'rule threads are plain relations (no arrowhead, not causal) and end on their ring'},
    {at: 1, fn: 's.rings === 1 && s.captions === 1 && s.relSim === 0', label: 'final hold: relevant similarity and difference marked, captions shown'},
    {at: 0.62, fn: 's.threads.every(q => q < 1) && s.captions === 0', label: 'captions (state) only appear in the hold, after the threads land'},
    {at: 0.3, fn: 's.nameAVisible === 1', label: 'the earlier case’s name stays readable through the tracing paper while B passes over it'},
    {at: 0.32, fn: '!s.sheetOverCard', label: 'the carried sheet never passes over the rule card'},
    {at: 0.26, fn: '!s.sheetOverCard', label: 'the carried sheet never passes over the rule card (early carry)'},
    {at: 1, fn: "s.threadCrossings === 0 && s.holder === 'none'", label: 'hold: the two threads do not cross; the hand has let go and withdrawn (nothing covers a label)'},
    {at: 0.52, fn: "s.holder === 'card' || s.holder === 'none'", label: 'between release and pick-up the hand holds no sheet'},
    {at: 1, params: {finalState: 'relevance-pending'}, fn: "s.threadKinds.every(k => k === 'pending') && s.finalState === 'relevance-pending'", label: 'pending relevance: threads drawn as pending (dashed), no mark asserted'},
    {at: 1, params: {actionProgress: 0.3}, fn: '!s.landed && s.actionCapped && s.mergeState.every(m => m === "apart")', label: 'actionProgress freezes the carry part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.landed && s.mergeState.every(m => m === 'merged') && s.lensOver === 2", label: 'labels hidden: the same physical transformation happens'},
    {at: 1, params: {facts: [
      {icon: 'ladder', a: 'Ladder lent', b: 'Ladder lent', relevant: true},
      {icon: 'calendar', a: 'Return date agreed', b: 'Return date agreed', relevant: true},
      {icon: 'key', a: '', b: 'Key handed over', relevant: false},
    ]}, fn: "JSON.stringify(s.kinds) === JSON.stringify(['shared','shared','only-b']) && s.mergeState.length === 2 && s.relDiff === null && s.lensOver === 2", label: 'supplied data drive the overlay: identical texts coincide; the lens goes to the feature only B has'},
  ],
});

// Per-ratio checks the contract battery (16:9 only) cannot make: every preset
// in 16:9, 1:1 and 9:16.
ratioChecks('LAW-0085', [
  ...TEXT_CHECKS,
  {at: 0.05, fn: "!P.actorLabels.a || s.reviewerCaption", label: 'the reviewer caption (actorLabels.a) is drawn from the start'},
  {at: 1, fn: "!P.actorLabels.a || s.reviewerCaption", label: 'the reviewer caption is still drawn in the hold'},
  {at: 1, fn: 's.pictoPx >= 50', label: 'feature pictograms stay at least ~50 px at 1080p', presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es']},
  {at: 1, fn: 's.pictoPx >= 20', label: 'long-label stress: pictograms stay readable', presets: ['long-labels-stress']},
  {at: 1, fn: 's.threadMinGap === null || s.threadMinGap >= 24', label: 'the two rule threads never run as a tight parallel pair'},
  {at: 1, fn: 's.lensPicCover <= 0.25', label: 'the parked magnifier does not hide the two variants’ pictograms'},
]);
