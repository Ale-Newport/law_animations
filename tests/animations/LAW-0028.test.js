// LAW-0028 — Traducción paralela · inspect. Contract battery + ID-specific
// checks encoding the brief's acceptanceCheck: the detail keeps its source
// coordinates, the change is localized (inside the lens first, then only the
// slot and its dependent bracket in context), and seeking back restores the
// previous datum exactly.
import {contractSuite} from '../harness/contract.js';

const inside = '((a, b) => a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1)';

contractSuite('LAW-0028', {
  continuity: ['view'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.contextValue === '?' && s.viewMode === 'full'", label: 'build: full context shows the before datum'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.viewMode === 'miniature' && s.lensBracketDashed === 1", label: 'isolate: lens open on the unchanged slot (dashed bracket)'},
    {at: 0.4, fn: `${inside}(s.contextSlot, s.source)`, label: 'the lens source region contains the real slot at its context coordinates'},
    {at: 0.6, fn: "s.datum === 'changing' && s.contextDatum === 'before' && s.contextValue === '?'", label: 'the substitution happens inside the lens only'},
    {at: 0.72, fn: "s.datum === 'after' && s.lensValue === 'fish-market hall' && s.lensBracketDashed === 0 && s.contextBracketDashed === 1", label: 'only the dependent bracket follows the new datum in the lens'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.contextValue === 'fish-market hall' && s.contextBracketDashed === 0 && s.markerVisible && s.viewMode === 'full'", label: 'return: context shows the new datum with a changed marker'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.lensValue === '?' && !s.markerVisible", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {beforeValue: 'fish market', afterValue: 'fish-market hall'}, fn: "s.contextValue === 'fish-market hall' && s.contextBracketDashed === 0 && s.lensBracketDashed === 0", label: 'wording substitution between available equivalents keeps the bracket solid'},
    {at: 0.35, params: {beforeValue: 'fish market', afterValue: 'fish-market hall'}, fn: "s.contextValue === 'fish market' && s.lensValue === 'fish market'", label: 'alternative before value shown before the substitution'},
  ],
});
