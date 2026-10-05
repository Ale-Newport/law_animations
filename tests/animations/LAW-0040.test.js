// LAW-0040 — Custodia del original · inspect. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

const inSource = "s.detailCenter.x > s.source.x && s.detailCenter.x < s.source.x + s.source.w && s.detailCenter.y > s.source.y && s.detailCenter.y < s.source.y + s.source.h";

contractSuite('LAW-0040', {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.lidClosed", label: 'context: the state produced by the action, with the before datum'},
    {at: 0.4, fn: `s.lensOpen > 0.9 && s.datum === 'before' && ${inSource}`, label: 'lens open on the unchanged detail; the source keeps the detail’s coordinates'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensSwap > 0 && s.lensSwap < 1 && s.contextDatum === 'before'", label: 'substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.datum === 'after'", label: 'returns to context with the new datum'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.datum === 'before' && s.lensSwap === 0 && s.contextSwap === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'boxLabel', beforeValue: 'Box 07', afterValue: 'Box 12'}, fn: `s.contextDatum === 'after' && s.focusTarget === 'boxLabel' && ${inSource}`, label: 'box-label substitution is localized on the box lid'},
  ],
});
