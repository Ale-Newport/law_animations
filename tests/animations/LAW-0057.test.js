// LAW-0057 — Lectura de sumario · story. Contract battery + ID-specific checks
// (brief acceptanceCheck: motion continuity, object anchors, and a
// transformation that stays recognisable with labels hidden).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0057', {
  continuity: ['cardTop', 'cardGrip', 'handNear', 'handFar'],
  attach: [
    // from contact to the end of the hold the researcher's solved hand IS the card's grip point
    {from: 0.3, to: 1, a: 'handNear', b: 'cardGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.holder === 'lectern' && s.pagesOpen === 0 && s.highlight === 0 && !s.searched", label: 'starts at rest: card on the stand, text folded, nothing searched'},
    {at: 0, fn: 's.stackBottom === s.seat', label: 'at rest the folded stack sits on the ledge'},
    {at: 0.22, fn: "s.searched && s.pagesOpen === 0 && s.holder === 'lectern'", label: 'the search result lights up before the card moves (cause first)'},
    {at: 0.45, fn: "s.holder === 'researcher' && s.pagesOpen > 0 && s.pagesOpen < s.targetPage", label: 'lifting the card pulls the folded text out panel by panel'},
    {at: 0.5, fn: 's.stackBottom === s.seat', label: 'while unfolding, the lowest fold still rests on the ledge (no floating paper)'},
    {at: 0.66, fn: 's.pagesOpen === s.targetPage && s.highlight === 0', label: 'the text is fully opened to the passage before it is marked'},
    {at: 1, fn: 's.pagesOpen === s.targetPage && s.targetPage === 2 && s.highlight === 1 && s.link === 1 && s.stackBottom === s.seat', label: 'ends opened exactly to the pointed page, passage marked and linked'},
    {at: 1, params: {citations: {paragraph: 2}}, fn: 's.targetPage === 1 && s.pagesOpen === 1', label: 'a passage on the first panel opens only one panel (the rest stays folded)'},
    {at: 1, params: {finalState: 'passage-located'}, fn: 's.highlight === 1 && s.link === 0', label: 'supplied state "passage located": marked, no bracket'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.pagesOpen === s.targetPage && s.highlight === 1 && s.link === 1', label: 'with labels hidden the same transformation happens'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.pagesOpen > 0 && s.pagesOpen < s.targetPage && s.highlight === 0 && s.actionCapped', label: 'actionProgress freezes the unfolding part-way'},
  ],
});
