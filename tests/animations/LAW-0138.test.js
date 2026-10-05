// LAW-0138 — Ámbito material · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its part, the order does not change
// when seeking, and a plain relation is never drawn as causation by default.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/sources/LAW-0138.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;
const ORDER = "JSON.stringify(s.visitOrder) === JSON.stringify(['hierarchy','source','article','filter','unclassified','magnifier'])";

contractSuite('LAW-0138', {
  continuity: ['tracer', 'c0', 'c1', 'c2', 'c3'],
  semantic: [
    {at: 0.02, fn: 's.separated < 1 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible', label: 'separate: parts still moving apart, no relationship drawn yet'},
    {at: 0.2, fn: 's.separated === 1 && s.relationsDrawn.every(p => p < 1)', label: 'parts separated before the relationships are drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && s.keyed.every(k => !k) && s.holders.every(h => h === "tray")', label: 'all relationships drawn before anything moves through them'},
    {at: 0.5, fn: 's.connectorsLand && !s.arrowOnPlainRelation && !s.kinds.includes("causal")', label: 'every connector ends on its part; a plain relation has no arrow; no causal link by default'},
    {at: 0.6, fn: ORDER + " && s.tracerVisible", label: 'the tracer follows the supplied traversal order'},
    {at: 0.62, fn: "s.visited.join() === s.visitOrder.slice(0, s.visited.length).join()", label: 'visits happen in the supplied order (no reordering when seeking)'},
    {at: 0.56, fn: "s.focusScale > 1 && s.focus === 'filter'", label: 'the focus part swells while the tracer is on it'},
    {at: 1, fn: "JSON.stringify(s.holders) === JSON.stringify(['bin0','bin1','side','bin2']) && s.keyed.every(Boolean) && s.statesShown === 1 && !s.tracerVisible", label: 'gather: origin, transformation and the supplied states stay visible'},
    {at: 0.6, params: {traversalOrder: ['activities', 'filter', 'included']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['activities','filter','included'])", label: 'the tracer follows another supplied order'},
    {at: 0.5, params: P('contrast-or-alternative'), fn: "s.kinds.includes('causal') && s.connectorsLand", label: 'a causal style appears only where the author supplies it'},
    {at: 1, params: P('contrast-or-alternative'), fn: "JSON.stringify(s.holders) === JSON.stringify(['bin0','side','bin1'])", label: 'alternative data: the cards follow the supplied list'},
    {at: 1, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.holders) === JSON.stringify(['bin0','bin1','side','bin2']) && s.connectorsLand", label: 'labels hidden: the same mechanism runs'},
  ],
});
