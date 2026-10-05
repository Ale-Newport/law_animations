// LAW-0060 — Lectura de sumario · inspect. Contract battery + ID-specific checks
// (brief acceptanceCheck: the detail keeps its source coordinates, the change is
// localised, and seeking back restores exactly the previous datum).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0060', {
  semantic: [
    {at: 0.19, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.linkTo === 3 && JSON.stringify(s.highlighted) === '[3]'", label: 'context is built: card pointing to ¶ 3, bracket drawn, passage marked'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before'", label: 'lens open on the unchanged pointer'},
    {at: 0.6, fn: "s.datum === 'changing' && s.contextDatum === 'before' && s.linkTo === 3", label: 'substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.linkTo === 2 && JSON.stringify(s.highlighted) === '[2]' && s.oldLinkTrace > 0", label: 'returns to context: bracket and highlight move to ¶ 2, old bracket still traceable'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.linkTo === 3 && JSON.stringify(s.highlighted) === '[3]'", label: 'seeking back restores the previous datum exactly'},
    {at: 0.4, fn: 's.source.w > 0 && s.source.h > 0 && s.cardTop.y > 0', label: 'the lens copies a real region of the context card'},
    {at: 1, params: {focusTarget: 'date', beforeValue: 'Day 12', afterValue: 'Day 15'}, fn: "s.contextDatum === 'after' && s.focusTarget === 'date' && s.linkTo === 3 && JSON.stringify(s.highlighted) === '[3]'", label: 'a date substitution leaves bracket and passage where they were (localised change)'},
    // placement checked in all three shapes (not only the 16:9 frame under test)
    {at: 0.6, fn: 'Object.values(s.clearance).every(c => c.annClear && c.markerClear && c.pinClear && c.bracketOffBoard)', label: 'before→after note clear of search box, stand, clip, strip, bracket and library chip; marker pin clear of the bracket start; brackets off the stand board (16:9, 9:16, 1:1)'},
    {at: 0.6, params: {focusTarget: 'citation', beforeValue: 'FICTIONAL-DECISION-2026-00118-B', afterValue: 'FICTIONAL-DECISION-2026-00121-A', contextLabels: {context: 'Summary card clipped above the opened text of the fictional decision', marker: 'Decision identifier changed'}}, fn: 'Object.values(s.clearance).every(c => c.annClear && c.markerClear && c.pinClear)', label: 'long identifiers keep the annotation and the marker clear in all shapes'},
    // the open lens window never cuts across the search box's result rows
    {at: 0.5, fn: 'Object.values(s.clearance).every(c => c.lensOffScreen)', label: 'the lens opens clear of the search box (16:9, 9:16, 1:1)'},
    {at: 0.5, params: {query: 'written notice of termination sent to the registered office', sources: {library: 'Municipal law library of fictional decisions', volume: 'Volume 12 (Day 1–Day 90)', database: 'Fictional case-law search service'}, citations: {decision: 'FICTIONAL-DECISION-2026-00118-B', paragraph: 4}, dates: {decision: 'Day 112 (fictional year)'}, focusTarget: 'citation', beforeValue: 'FICTIONAL-DECISION-2026-00118-B', afterValue: 'FICTIONAL-DECISION-2026-00121-A', contextLabels: {context: 'Summary card clipped above the opened text of the fictional decision', marker: 'Decision identifier changed'}}, fn: 'Object.values(s.clearance).every(c => c.lensOffScreen && c.annClear)', label: 'long identifiers: the lens still opens clear of the search box in every shape'},
    {at: 1, fn: 's.oldLinkTrace >= 0.5', label: 'the old bracket stays traceable (dashed trace at ≥ 50% opacity)'},
    {at: 1, fn: 's.libChip === 1', label: 'the library chip is back in the returned context (only the datum changed)'},
  ],
});
