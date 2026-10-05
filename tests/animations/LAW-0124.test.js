// LAW-0124 — Texto y contexto · inspect. Contract battery + checks encoding
// the brief's acceptanceCheck: the detail keeps its source coordinates, the
// change is localised (only the dependent occurrences/rail update, other
// passages do not move), and seeking back restores the previous datum exactly.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0124', {
  continuity: ['lensCenter', 'ghost'],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.shownValue === 'unit' && s.lensOpen === 0 && s.occurrences === 2", label: 'build: context with the supplied datum and its two other occurrences'},
    {at: 0.19, fn: "s.contextMarks && s.cardShown && s.lensOpen === 0", label: 'the state produced by the action is built before the lens opens'},
    {at: 0.44, fn: "s.lensOpen === 1 && s.mapsSource && s.lensZoom > 2 && s.datum === 'before'", label: 'the lens is a real copy magnified about the detail (source coordinates map to the lens centre)'},
    {at: 0.3, fn: "s.mapsSource && s.lensOpen > 0 && s.lensOpen < 1", label: 'source mapping holds while the lens travels'},
    {at: 0.535, fn: "s.oldStruck && s.oldTraceable && s.datum === 'before'", label: 'the old datum is struck and kept traceable before it is replaced'},
    {at: 0.6, fn: "s.datum === 'after' && s.shownValue === 'room' && !s.railRedrawn", label: 'the new datum appears only after the old one has lifted off'},
    {at: 0.74, fn: "s.railRedrawn && s.occurrences === 1 && s.occurrencesBefore === 2 && s.otherPassagesFixed", label: 'only the dependent state updates: occurrences re-found in the supplied text; other passages do not move'},
    {at: 1, fn: "s.lensOpen === 0 && s.marker && s.datum === 'after' && s.oldTraceable", label: 'return: lens closed, changed-datum marker kept'},
    {at: 0.4, fn: "s.datum === 'before' && s.shownValue === 'unit' && s.occurrences === 2", label: 'seeking back before the swap restores the previous datum exactly'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.marker && s.railRedrawn", label: 'labels hidden: substitution and marker still complete'},
    {at: 1, params: {focusTarget: 'passage', beforeValue: 'In this article, a unit is a room listed in Text 2.', afterValue: 'In this article, rooms are listed in Text 2.', detailGeometry: {zoom: 2.2, placement: 'auto'}}, fn: "s.focus === 'passage' && s.occurrencesBefore === 2 && s.occurrencesAfter === 1 && s.otherPassagesFixed", label: 'passage focus: the replaced passage drops an occurrence; other passages stay put'},
  ],
});

// Reviewer round B007 (all ratios): the detail view was a second complete
// magnifier (rim, ferrule, wooden handle) floating ungrasped while the reader's
// identical magnifier lay on the desk; in 1:1 the "Datum changed" marker sat at
// the bottom of the desk with a long three-segment leader; in long-labels 16:9
// the inset was off-centre and clipped the key word. Every preset × ratio ×
// labels shown/hidden:
//  - exactly one magnifier (one wooden handle) is ever visible, at every time;
//  - the inset is centred on the key word and both the old and new word lie
//    inside it;
//  - the marker's leader never crosses the article's text and stays short.
import {ratioChecks, times} from './texto-y-contexto-ratio-checks.js';

ratioChecks('LAW-0124', 'one magnifier only; inset centred on the key word; short marker leader clear of text', [
  {at: times(0, 1, 0.05), dom: "[...svg.querySelectorAll('path[fill=\"#6d4a32\"]')].filter(visible).length === 1", label: 'exactly one magnifier handle is visible (no floating duplicate prop)'},
  {at: [0.3, 0.44, 0.6], fn: '!s.insetHasHandle && s.insetCentredOnKey && s.insetShowsKey && s.mapsSource', label: 'inset centred on the key word; old and new word inside it'},
  {at: [1], fn: 's.marker && s.markerDrawn && s.markerLeadHits === 0 && s.markerLeadShare < 0.45 && s.markerLeadDetour < 140', label: 'marker (text-free badge with labels hidden) beside the article with a short leader that crosses no text'},
  {at: [1], params: {focusTarget: 'passage', beforeValue: 'In this article, a unit is a room listed in Text 2.', afterValue: 'In this article, rooms are listed in Text 2.'}, fn: 's.markerDrawn && s.markerLeadHits === 0 && s.markerLeadShare < 0.45 && s.markerLeadDetour < 140', label: 'passage focus: marker leader short and clear of text'},
]);
