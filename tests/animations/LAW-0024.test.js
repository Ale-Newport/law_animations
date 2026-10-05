// LAW-0024 — Anexo incorporado · inspect. Contract battery + ID-specific checks.
// Acceptance (brief): the detail keeps its source coordinates, the change is
// localised, and seeking back to earlier times restores exactly the previous datum.
import {contractSuite} from '../harness/contract.js';

const SAME_SOURCE = 'Math.abs(s.source.x - s.region.x) < 0.5 && Math.abs(s.source.y - s.region.y) < 0.5 && Math.abs(s.source.w - s.region.w) < 0.5 && Math.abs(s.source.h - s.region.h) < 0.5';

contractSuite('LAW-0024', {
  // the annex moves only inside the lens copy (substitution) and then in the context (return)
  continuity: ['lensAnnex', 'contextAnnex'],
  semantic: [
    {at: 0.1, fn: `s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.context.holder === 'separate' && s.context.link === 0 && ${SAME_SOURCE}`, label: 'context shows the before datum (annex laid apart, no link); lens source is the detail region itself'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lens.holder === 'separate' && s.lens.link === 0", label: 'lens open on the unchanged detail'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensChange > 0 && s.context.holder === 'separate' && s.context.link === 0 && JSON.stringify(s.lens.annex) !== JSON.stringify(s.context.annex)", label: 'substitution happens inside the lens only (the context keeps the before datum)'},
    {at: 0.72, fn: "s.datum === 'after' && s.lens.link === 1 && s.lens.holder === 'docked' && s.context.holder === 'separate' && s.contextDatum === 'before'", label: 'lens shows the after datum: annex joined and linked; context unchanged until the return'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.context.link === 1 && s.context.holder === 'docked' && Math.hypot(s.context.eyelet.x - s.lens.eyelet.x, s.context.eyelet.y - s.lens.eyelet.y) < 0.5", label: 'returns to context with the new datum, identical to the lens'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.datum === 'before' && s.context.link === 0 && s.context.holder === 'separate'", label: 'seeking back restores the previous datum exactly'},
    {at: 0.1, fn: "s.contextPlacement === 'full'", label: 'the context is first shown full size'},
    {at: 0.5, fn: "s.contextPlacement === 'docked' && s.lensOpen === 1", label: 'the context steps aside while the lens is open'},
    {at: 1, fn: "s.contextPlacement === 'full' && s.lensOpen === 0", label: 'final hold: the context returns to full size (lens closed)'},
    {at: 1, params: {focusTarget: 'clause', beforeValue: 'Clause 2', afterValue: 'Clause 3'}, fn: "s.focusTarget === 'clause' && s.contextDatum === 'after' && s.context.link === 1", label: 'clause substitution: the annex is re-attached at the other clause'},
    {at: 0.3, params: {focusTarget: 'clause', beforeValue: 'Clause 2', afterValue: 'Clause 3'}, fn: "s.contextDatum === 'before' && s.context.link === 1", label: 'clause substitution: seeking back shows the original attachment'},
    {at: 1, params: {focusTarget: 'annexId', beforeValue: 'Annex 1', afterValue: 'Annex A'}, fn: "s.focusTarget === 'annexId' && s.contextDatum === 'after' && s.context.link === 1 && JSON.stringify(s.context.annex) === JSON.stringify(s.lens.annex)", label: 'annex id substitution leaves the geometry unchanged'},
    {at: 0.6, fn: 's.coreInLens', label: 'the lens region contains the whole detail (clause, reference, tab)'},
    {at: 0.6, params: {focusTarget: 'annexId', clauses: ['Definitions and interpretation of terms used throughout this agreement', 'Technical specifications of the equipment to be supplied', 'Fees, invoicing and payment arrangements (hypothetical amounts only)'], reference: 'as set out in Schedule 3', beforeValue: 'Schedule 3', afterValue: 'Schedule 3A (revised)'}, fn: "s.coreInLens && s.markerFrames === 2", label: 'annex id: the lens keeps the wrapped reference; the marker frames the header and the reference separately'},
  ],
});
