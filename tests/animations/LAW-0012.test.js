// LAW-0012 — Apertura de expediente · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens holds a real
// copy of the same desk), the change is localized, and seeking back restores the
// previous datum exactly.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0012', {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextPresent === 1 && s.contextTicks[2] === 1", label: 'context shows the before datum (document present, entry ticked)'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensPresent === 1", label: 'lens open on the unchanged detail'},
    {at: 0.4, fn: 's.lensAligned && s.source.w > 0 && s.source.h > 0', label: 'the lens holds a real copy at the same source coordinates'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensPresent > 0 && s.lensPresent < 1 && s.contextPresent === 1 && s.contextTicks[2] === 1", label: 'substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextPresent === 0 && s.contextDatum === 'after' && s.contextTicks[2] === 0 && s.contextTicks.filter((t, i) => i !== 2).every(t => t === 1)", label: 'returns to context with the new datum; only its own tick changes'},
    {at: 0.3, fn: "s.contextPresent === 1 && s.datum === 'before' && s.contextTicks[2] === 1", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'heading', beforeValue: 'Supporting letter', afterValue: 'Supporting letter (copy)'}, fn: "s.focusTarget === 'heading' && s.contextDatum === 'after' && s.contextPresent === 1 && s.contextTicks.every(t => t === 1)", label: 'heading substitution leaves presence and ticks unchanged'},
    {at: 1, params: {focusTarget: 'fileNumber', beforeValue: 'EXP-0417', afterValue: 'EXP-0471'}, fn: "s.focusTarget === 'fileNumber' && s.contextSwap === 1 && s.contextTicks.every(t => t === 1)", label: 'file-number substitution changes only the number'},
    {at: 1, params: {documentPresentAfter: true, beforeValue: 'Listed, not in the file', afterValue: 'Filed'}, fn: 's.contextPresent === 1 && s.contextTicks[2] === 1', label: 'reverse substitution: the document is added to its slot'},
  ],
});
