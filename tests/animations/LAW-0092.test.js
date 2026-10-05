// LAW-0092 — Distinción de casos · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (a real copy scaled about the
// source region), the change is local (one entry and only its dependants), and seeking
// back to earlier times restores the previous datum exactly.
import {contractSuite} from '../harness/contract.js';

const PRESENT = {
  facts: [
    {text: 'Lease signed for one year', icon: 'document', in: 'both'},
    {text: 'Rent paid every month', icon: 'calendar', in: 'both'},
    {text: 'Neighbour phoned in a complaint', icon: 'phone', in: 'b'},
    {text: 'Keys returned on day 30', icon: 'key', in: 'both'},
  ],
  focusTarget: 'present-entry', beforeValue: 'Neighbour phoned in a complaint', afterValue: 'Neighbour wrote a complaint letter', afterIcon: 'letter',
};

contractSuite('LAW-0092', {
  continuity: ['lensC'],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.link === 'broken' && s.clipTag === 'distinguishing' && s.tokenInSocket === false && s.afterShown === 0", label: 'context: the produced state with the before datum (broken link, fact in the clip)'},
    {at: 0.231, fn: 's.zoom < 1.05 && s.copyErr < 0.01', label: 'the magnifier lifts off as an exact copy at the source coordinates'},
    {at: 0.29, fn: 's.lensOpen > 0 && s.lensOpen < 1 && s.copyErr < 0.01', label: 'while it travels, the enlarged copy stays mapped to its source region'},
    {at: 0.4, fn: "s.lensOpen === 1 && Math.abs(s.zoom - s.zoomAtDest) < 0.001 && s.zoom > 1.4 && s.dim === 1 && s.datum === 'before' && s.link === 'broken'", label: 'isolated and enlarged before anything changes'},
    {at: 0.72, fn: "s.datum === 'after' && s.beforeStruck === 1 && s.afterShown === 1 && s.tokenInSocket === true && s.link === 'closed' && s.clipTag === 'recorded-both' && s.lensOpen === 1", label: 'substitution: after value in place, before value struck (kept), socket filled, link closed, dependent tag updated'},
    {at: 0.72, fn: 'JSON.stringify(s.links) === JSON.stringify([1, 1, 1, 1])', label: 'the other rows are untouched'},
    {at: 1, fn: "s.lensOpen === 0 && s.dim === 0 && s.markerShown && s.entryValue === 'after' && s.beforeStruck === 1 && s.beforeShown", label: 'return: back to context with a changed-datum marker; the old value stays traceable'},
    {at: 0.45, fn: "s.datum === 'before' && s.afterShown === 0 && s.beforeStruck === 0 && s.link === 'broken' && s.clipTag === 'distinguishing'", label: 'seeking back before the substitution restores the old datum exactly'},
    {at: 0.72, params: PRESENT, fn: "s.target === 'present-entry' && s.targetSide === 'b' && s.icon === 'letter' && s.link === 'broken' && s.clipTag === 'distinguishing' && s.tokenInSocket === null", label: 'present entry: only the pictogram and value change; the link stays broken'},
    {at: 0.4, params: PRESENT, fn: "s.icon === 'phone' && s.datum === 'before'", label: 'present entry: before the substitution the original pictogram is shown'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.lensOpen === 0 && s.link === 'closed' && s.tokenInSocket === true && s.markerShown", label: 'the substitution reads with labels hidden (token, link, pin)'},
    {at: 1, fn: 's.outcome === null', label: 'no outcome is inferred'},
  ],
});
