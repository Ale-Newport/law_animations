// LAW-0068 — Extracción de hechos · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens source IS the
// first card entry), the change is local (only that entry's wording and its dependent
// state/trail) and seeking back to earlier times restores the previous wording exactly.
import {contractSuite} from '../harness/contract.js';

const BEFORE = 'Party B signed the delivery note on Day 4.';
const AFTER = 'Party B received the goods on Day 4.';

contractSuite('LAW-0068', {
  // intentional overprint: the opaque lens window slides over the second card entry on its way out and
  // back (and rests on it when the card is full); the window hides what it covers, which the text
  // heuristic cannot see. Only that entry's wording, tag and ¶ pin are exempt (per preset wording).
  allowTextOverlap: ['The carrier collected', 'The minutes were', 'The regional carrier', 'El transportista', '¶2', '¶4'],
  semantic: [
    {at: 0.1, fn: `s.lensOpen === 0 && s.datum === 'before' && s.contextWording === ${JSON.stringify(BEFORE)} && s.contextState === 'quoted' && s.trailStyle === 'solid' && s.trailTo === 3`, label: 'context: the entry is a quotation of ¶3 with a solid trail'},
    {at: 0.41, fn: `s.lensOpen > 0.9 && s.lensWording === ${JSON.stringify(BEFORE)} && s.lensState === 'quoted'`, label: 'lens open on the unchanged entry'},
    {at: 0.41, fn: 'JSON.stringify(s.source) === JSON.stringify(s.entryBox)', label: 'the lens source keeps the coordinates of the entry in the context'},
    {at: 0.58, fn: `s.datum === 'changing' && s.contextWording === ${JSON.stringify(BEFORE)} && s.contextState === 'quoted'`, label: 'the substitution happens inside the lens only'},
    {at: 0.72, fn: `s.lensWording === ${JSON.stringify(AFTER)} && s.lensState === 'not-on-page' && s.contextWording === ${JSON.stringify(BEFORE)}`, label: 'only the dependent state follows the new wording (not written on the page)'},
    {at: 1, fn: `s.lensOpen === 0 && s.contextWording === ${JSON.stringify(AFTER)} && s.contextState === 'not-on-page' && s.trailStyle === 'dashed' && s.trailTo === 3 && s.marker === 1 && s.otherEntriesUnchanged`, label: 'returns to the context with the new wording, a dashed trail and the marker'},
    {at: 0.3, fn: `s.contextWording === ${JSON.stringify(BEFORE)} && s.lensWording === ${JSON.stringify(BEFORE)} && s.datum === 'before' && s.trailStyle === 'solid'`, label: 'seeking back restores the previous wording exactly'},
    {at: 0.41, fn: "s.fit.lensPlace === 'clear' && s.fit.lensZoom >= 1.3", label: 'the lens window lies on a spot of the context that holds no writing'},
    {at: 1, fn: 's.markerOnEntryRow && s.oldWordingShown === 1 && s.oldWordingStruck === 1', label: 'after the return the struck-through old wording stays docked under the entry and the change marker sits on its row'},
    {at: 1, params: {afterValue: 'The carrier collected the goods on Day 3.'}, fn: "s.contextState === 'quoted' && s.trailTo === 2 && s.trailStyle === 'solid'", label: 'a wording written elsewhere on the page moves the ¶ tab and the trail there'},
  ],
});
