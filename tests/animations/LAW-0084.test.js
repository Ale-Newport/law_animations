// LAW-0084 — Hecho y regla · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens starts as
// a scale-1 copy exactly on the row of the context thumbnail), the change is
// localised (one datum, then only that row's bolt moves to the stop supplied
// for after) and seeking back restores exactly the previous datum.
import {contractSuite} from '../harness/contract.js';

const BEFORE = 'Seen there at 21:40';
const AFTER = 'Both sides agree it was there at 21:40';

contractSuite('LAW-0084', {
  // Intentional overprint: in the long-labels preset the focus row is not the last one, so while the
  // opaque lens window travels from the row down to its destination it passes over the next row of the
  // dimmed context thumbnail ("No sign was placed…"); the lens covers that row, it is not a label collision.
  allowTextOverlap: ['No sign was placed'],
  continuity: ['lens', 'slip', 'tipF', 'tagSlot'],
  attach: [
    // the picked-up slip sits exactly on the old text inside the open lens until it is pulled out
    {from: 0.461, to: 0.499, a: 'slip', b: 'slipHome', tol: 0.6},
    // at the end the slip rests inside the tag, which rides the context as it grows back
    // (it reaches its tag slot under the thumbnail as the lens closes, then rides the context back to full size)
    {from: 0.851, to: 1, a: 'slip', b: 'tagSlot', tol: 0.6},
  ],
  semantic: [
    {at: 0.17, fn: `s.contextFull && s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && !s.lensVisible && s.focusStatus === 'disputed' && s.focusTravel === s.travelBefore && s.otherTravel[0] === s.travelAfter && s.otherTravel[1] === s.travelAfter`, label: 'build: full-size context, bolts at their supplied stops (focus row stops short), old datum in the row'},
    {at: 0.27, fn: 's.contextThumb && s.lensVisible && s.lensAtSource && s.lensScale === 1 && s.sourceOnRow', label: 'isolate: the lens starts as a scale-1 copy exactly on the row of the context thumbnail (source coordinates kept)'},
    {at: 0.44, fn: "s.lensScale >= 1.5 && s.dim > 0 && s.datum === 'before' && s.oldValueShownIn === 'row' && s.focusTravel === s.travelBefore", label: 'isolate: the row is enlarged, the rest dims; nothing has changed yet'},
    {at: 0.6, fn: "s.slipVisible && !s.oldValueInRow && s.slip.y > s.lensRect.y + s.lensRect.h && s.oldValueShownIn === 'slip' && s.focusTravel === s.travelBefore", label: 'substitute: the old value is pulled out of the lens as a slip (kept in view); the bolt has not moved yet (datum first, dependent state after)'},
    {at: 0.66, fn: `s.datum === 'after' && s.datumValue === ${JSON.stringify(AFTER)} && s.slipStruck`, label: 'substitute: the supplied new value is in the row; the old one is struck on its slip'},
    {at: 0.75, fn: "s.focusStatus === 'as-supplied' && s.focusTravel === s.travelAfter && s.otherTravel[0] === s.travelAfter && s.otherTravel[1] === s.travelAfter && s.otherTravel[2] === null", label: 'only the focus row’s bolt moved, to the stop of the status supplied for after; other rows unchanged'},
    {at: 0.8, fn: 's.slipVisible && s.lensVisible && s.slip.y > s.lensRect.y + s.lensRect.h', label: 'return: while the lens closes the struck slip travels with it, always below the lens (never parked alone)'},
    {at: 0.86, fn: "s.slipInTag && s.contextThumb && s.oldValueShownIn === 'tag'", label: 'return: the slip reaches its tag slot under the thumbnail before the context grows back'},
    // round 2: the tag never shows without its leader; the leader grows out of the tag towards the row
    ...[0.832, 0.84, 0.85, 0.86, 0.87].map(at => ({at, fn: 's.tagOpacity === 0 || s.leaderDrawn > 0', label: `return: the tag is joined by its (growing) leader whenever it shows @${at}`})),
    // round 2: the lens never doubles its own row's text while it lifts off / settles back
    ...[0.29, 0.3, 0.31, 0.33, 0.8, 0.82, 0.83, 0.84].map(at => ({at, fn: '!s.lensOverRow || s.rowTextHiddenUnderLens', label: `lens over its own row: the row's context text waits (no doubled words) @${at}`})),
    // round 2: the supplied issue and assumption and the key (bolt stop = status as supplied, no conclusion) are drawn in the full views
    {at: 0.12, fn: "s.notesVisible && s.notes.some(n => n.includes('When did the garden close')) && s.notes.some(n => n.includes('main path counts as shared')) && s.notes.some(n => n.includes('status as supplied') && n.includes('no conclusion'))", label: 'build: supplied issue, assumption and bolt-stop key are drawn'},
    {at: 1, fn: "s.notesVisible && s.notes.length === 3", label: 'hold: the issue, the assumption and the key are drawn again with the changed-datum tag'},
    {at: 0.66, fn: "s.focusLook === 'as-supplied'", label: 'the moving bolt shows one look (the after status), never a blend of both'},
    {at: 1, fn: "s.contextFull && !s.lensVisible && s.markerVisible && s.pinVisible && s.slipInTag && s.slipStruck && s.datum === 'after' && s.oldValueShownIn === 'tag'", label: 'return: full context again; the changed row keeps a pin and a tag holding the struck old value'},
    {at: 0.3, fn: `s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && s.focusTravel === s.travelBefore && !s.slipVisible && s.focusStatus === 'disputed'`, label: 'seeking back (after the end) restores exactly the old datum and its bolt stop'},
    {at: 0.75, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.focusTravel === s.travelAfter && s.slipVisible && s.contextThumb", label: 'labels hidden: the same slip, substitution and bolt move happen'},
    {at: 1, params: {textVisibility: 'all', afterStatus: 'pending'}, fn: "s.focusStatus === 'pending' && s.focusTravel === 0", label: 'status supplied as pending after the change: the bolt retracts (nothing inferred from the text)'},
    {at: 0.75, params: {afterStatus: 'disputed', focusTarget: 'condition', focusRow: 1, beforeValue: 'by a plot holder', afterValue: 'by the holder of any plot'}, fn: "s.focusTarget === 'condition' && s.datum === 'after' && s.datumValue === 'by the holder of any plot' && s.statusBefore === 'as-supplied' && s.focusStatus === 'disputed' && s.focusTravel < s.travelBefore && s.otherTravel[0] === s.travelBefore", label: 'condition side: the rule text is replaced and that row’s bolt moves from seated to stopping short (as supplied)'},
  ],
});
