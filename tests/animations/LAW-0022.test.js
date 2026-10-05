// LAW-0022 — Anexo incorporado · mechanism. Contract battery + ID-specific checks.
// Acceptance (brief): every connector ends on its element, the traversal order
// does not change with seeking, and a relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0022', {
  continuity: ['tracer', 'strip', 'annex'],
  semantic: [
    {at: 0, fn: 's.stripLifted === 0 && s.annexOut === 0 && s.referenceWritten === 0 && !s.tracerVisible', label: 'starts assembled: clause in its slot, annex in its folder, nothing written'},
    {at: 0.18, fn: 's.stripLifted === 1 && s.annexOut === 1 && s.relationsDrawn.every(p => p === 0)', label: 'separate beat: components apart before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && s.referenceWritten === 0 && !s.joined', label: 'all relations drawn before the tracer runs; the change has not happened yet'},
    {at: 1, fn: 's.referenceWritten === 1 && s.joined && !s.tracerVisible', label: 'gather: reference written and port joined, tracer gone'},
    {at: 1, fn: 's.gathered === 1 && s.stripInSlot && s.annexTabAtClause && s.relationsFolded === 1 && s.gatheredRelations.length > 0 && s.gatheredRelationsDrawn.every(p => p === 1)', label: 'gather re-assembles: strip back in its slot, annex tab at the clause, non-embodied relations redrawn'},
    {at: 0.74, fn: 's.gathered === 0 && s.stripLifted === 1 && s.referenceWritten === 1', label: 'the change happens in the exploded view, before the gather'},
    {at: 0.62, fn: 's.tracerVisible && s.gathered === 0', label: 'tracer runs on the exploded mechanism'},
    {at: 0.5, fn: 's.connectorsLand', label: 'every connector ends on its element edge'},
    {at: 0.5, fn: "s.kinds.includes('relation') && !s.kinds.includes('causal') && !s.arrowOnPlainRelation", label: 'plain relations carry no arrowhead; nothing is causal by default'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','annex','clause','contract'])", label: 'tracer follows the default traversal order'},
    {at: 0.6, params: {traversalOrder: ['pen', 'clause', 'annex', 'seal']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['pen','clause','annex','seal'])", label: 'tracer follows a supplied traversal order'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.connectorsLand && s.tracerVisible', label: 'labels hidden: the mechanism still runs'},
    {at: 1, fn: 's.rejoinedTextRatio >= 1.2', label: 'the rejoined clause is set larger than the contract text (readable after the gather)'},
    {at: 1, params: {linkedClause: 4, reference: 'as set out in Schedule 3', clauses: ['Definitions and interpretation of terms used throughout this agreement', 'Scope of the supply obligations and the maintenance schedule', 'Fees, invoicing and payment arrangements (hypothetical amounts only)', 'Duration, renewal and the procedure for giving notice', 'Technical specifications of the equipment to be supplied']}, fn: 's.rejoinedTextRatio >= 1.2 && s.stripInSlot && s.annexTabAtClause', label: 'five long clauses: the rejoined clause stays larger than the contract text'},
  ],
});
