// LAW-0444 — Oferta comunicada · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is local
// (only the datum and its dependent line), and seeking back restores the old datum.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0444', {
  continuity: ['sheetCenter', 'handB'],
  attach: [{from: 0, to: 1, a: 'handB', b: 'gripB', tol: 1.5}],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === '130' && s.lensTotal === 5200", label: 'context shows the before datum and its computed total'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensValue === '130'", label: 'lens open on the unchanged detail'},
    {at: 0.4, fn: 's.source.x < s.sheetCenter.x && s.source.x + s.source.w > s.sheetCenter.x && s.source.y > s.sheetCenter.y', label: 'the lens source is the lower (pricing) part of the sheet B holds'},
    {at: 0.55, fn: "s.datum === 'changing' && s.contextValue === '130' && s.contextTotal === 5200", label: 'substitution happens inside the lens only'},
    {at: 0.72, fn: "s.lensValue === '120' && s.lensTotal === 4800 && s.contextValue === '130'", label: 'only the dependent line (computed total) follows the new datum'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextValue === '120' && s.contextTotal === 4800 && s.contextDatum === 'after'", label: 'returns to the context with the new datum'},
    {at: 0.3, fn: "s.contextValue === '130' && s.datum === 'before' && s.lensTotal === 5200", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'delivery', beforeValue: 'Day 10', afterValue: 'Day 14'}, fn: "s.contextValue === 'Day 14' && !s.dependent && s.contextTotal === 5200", label: 'a datum without dependents leaves the computed total unchanged'},
  ],
});
