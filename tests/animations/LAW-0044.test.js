// LAW-0044 — Búsqueda por términos · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is
// localised, and seeking back restores exactly the previous datum.
import {contractSuite} from '../harness/contract.js';

const CTX = {query: {terms: [{text: 'notice', related: ['notification']}, {text: 'delivery'}], mode: 'contextual'}};

contractSuite('LAW-0044', {
  // the context view eases aside for the lens and back without jumps
  continuity: ['view'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextLinked.includes('0:0:exact')", label: 'context shows the finished search with the before datum'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensLinked.includes('0:0:exact')", label: 'lens open on the unchanged passage line'},
    {at: 0.66, fn: "s.datum === 'after' && !s.lensLinked.includes('0:0:exact') && JSON.stringify(s.lensLinked) === JSON.stringify(s.contextLinked)", label: 'the lens and its source region change together (the lens is a real copy)'},
    {at: 0.66, fn: "s.lensLinked.filter(k => k !== '0:0:exact').join() === ['0:1:exact', '2:1:exact', '2:2:exact'].join()", label: 'the change is localised: every other link is untouched'},
    {at: 0.4, fn: 's.dotsLit === 4', label: 'before the change the kiosk shows one lit result dot per linked passage'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && !s.contextLinked.includes('0:0:exact') && s.contextLinked.length === 3 && s.dotsLit === 3", label: 'returns to context with the new datum and its consequence (links and result dots)'},
    {at: 0.76, fn: '!s.annotationVisible', label: 'the before → after annotation leaves before the lens closes'},
    {at: 0.3, fn: "s.contextSwap === 0 && s.lensSwap === 0 && s.datum === 'before' && s.contextLinked.includes('0:0:exact') && s.dotsLit === 4", label: 'seeking back restores the previous datum exactly'},
    {at: 0.4, fn: 's.source.w > 0 && s.zoom >= 1.2', label: 'the lens enlarges a real source region'},
    {at: 1, params: {focusTarget: 'term', beforeValue: 'notice', afterValue: 'notified'}, fn: "s.contextLinked.includes('1:0:exact') && !s.contextLinked.includes('0:0:exact') && s.focusTarget === 'term' && s.dotsLit === s.contextLinked.length", label: 'term substitution moves the links to the passages containing the new term'},
    {at: 1, params: CTX, fn: "s.contextLinked.includes('0:0:contextual') && s.dotsLit === s.contextLinked.length", label: 'in contextual mode the replaced word can stay linked through related wording (its dot relit)'},
  ],
});
