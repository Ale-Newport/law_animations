// LAW-0074 — Matriz de autoridades · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the order does not change when
// seeking, and a relation is never drawn as causation by default.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/research/LAW-0074.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;

contractSuite('LAW-0074', {
  continuity: ['tracer', 'pin', 'c_search', 'c_library', 'c_source', 'c_cell', 'c_proposition'],
  semantic: [
    {at: 0, fn: 's.relationsDrawn.every(p => p === 0) && !s.tracerVisible && !s.cellPinned && s.spread === 0', label: 'separate: packed pieces, no relation drawn, empty cell'},
    {at: 0.18, fn: 's.spread === 1 && s.relationsDrawn.every(p => p === 0)', label: 'pieces pulled apart before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later relation never starts before the previous one is complete (supplied order)'},
    {at: 1, fn: 's.linkEnds.every(Boolean)', label: 'every connector starts and ends on the edge of its own element'},
    {at: 1, fn: "JSON.stringify(s.linkStyles) === JSON.stringify(['sequence', 'relation', 'relation', 'relation']) && !s.linkStyles.includes('causal')", label: 'styles follow the supplied kinds; nothing is drawn as causal by default'},
    {at: 1, fn: 'JSON.stringify(s.arrowheads) === JSON.stringify([true, false, false, false])', label: 'plain relations (row, column, holds) carry no arrowhead'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all supplied relations drawn before the tracer runs'},
    {at: 0.55, fn: "!s.cellPinned && !s.visitOrder.includes('cell')", label: 'the cell does not change before the tracer reaches it'},
    {at: 0.3, fn: "s.pinHolder === 'card'", label: 'the citation pin waits on the proposition card (its grommet) before the trace'},
    {at: 0.6, fn: "s.pinHolder === 'row' && Math.abs(s.pin.y - s.c_proposition.y) < 8 && s.pin.x > s.c_proposition.x && s.pin.x < s.c_cell.x", label: 'the pin physically rides along the row from the card towards the cell (no appearance from nothing)'},
    {at: 0.66, fn: "s.cellPinned === s.visitOrder.includes('cell') && Math.hypot(s.pin.x - s.c_cell.x, s.pin.y - s.c_cell.y) < 0.5", label: 'the pin lands in the cell as the tracer arrives there'},
    ...[0.46, 0.5, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68, 0.71, 0.74].map(at => ({at, fn: 's.tracerVisible && s.tracerClear', label: `trace t=${at}: the tracer is in view (on a connector or round an element's outline, never under an element)`})),
    {at: 1, fn: 's.labelsOffLines', label: 'relation captions sit beside their connectors, never on them (the tracer path stays clear)'},
    {at: 1, fn: "s.cellPinned && s.tabShown && !s.tracerVisible && JSON.stringify(s.visitOrder) === JSON.stringify(['search', 'library', 'source', 'cell', 'proposition'])", label: 'gather: pin in the cell, tab on the card, visit order as supplied'},
    {at: 1, fn: 's.contextShown === 1 && s.hasContext && s.citedRow === 0 && s.citedCol === 0', label: 'gather: the pending row is shown as context; the traced link is the first supplied citation'},
    {at: 0.7, params: {traversalOrder: ['proposition', 'cell', 'source']}, fn: "JSON.stringify(s.visitOrder.slice(0, 2)) === JSON.stringify(['proposition', 'cell'])", label: 'the tracer follows the supplied traversal order'},
    {at: 0.6, params: {focusElement: 'source'}, fn: "s.focus === 'source'", label: 'focus element is configurable'},
    {at: 1, params: {relationships: [{from: 'search', to: 'library', kind: 'causal'}, {from: 'proposition', to: 'cell', kind: 'relation'}]}, fn: "JSON.stringify(s.linkStyles) === JSON.stringify(['causal', 'relation']) && s.arrowheads[0] && !s.arrowheads[1] && s.linkEnds.every(Boolean)", label: 'a causal style appears only where the author supplies it'},
    {at: 1, params: {citations: []}, fn: '!s.cellPinned && !s.tabShown && s.citedRow === null', label: 'with no supplied citation the cell stays empty (nothing is inferred)'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: 's.cellPinned && s.linkEnds.every(Boolean)', label: 'labels hidden: the same mechanism runs'},
    ...[['landscape', {}], ['square', {safeArea: {top: 0.06, bottom: 0.2, left: 0.25, right: 0.25}}], ['portrait', {safeArea: {top: 0.02, bottom: 0.02, left: 0.36, right: 0.36}}]].flatMap(([shape, sa]) => [
      ...['baseline-illustrative', 'contrast-or-alternative', 'long-labels-stress', 'baseline-es'].map(name => ({at: 1, params: {...P(name), ...sa},
        fn: 's.layoutChecks.supportedAboveLine && s.layoutChecks.pendingBesideSocket && s.layoutChecks.sourceCaptionClear && s.layoutChecks.propCaptionOwn',
        label: `${shape}, ${name}: the supplied-source tag stays on the cell's side of the pending row's dashed line, the pending tag sits by its socket, the source caption is clear of the pending placeholder and the card caption is nearest its own card`})),
    ]),
  ],
});
