// LAW-0118 — Límite de una conclusión · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element (checked while drawn, while the focus part is
// enlarged and while the parts gather, in every preset × shape), the order does not change when seeking
// (tracer visits follow the supplied traversal order) and a relation is never drawn as causation by default.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import def from '../../src/animations/reasoning/LAW-0118.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0118').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
// the moment the tracer passes the focus part (computed from the module for the default params)
const focusU = def.evaluate({width: 1920, height: 1080, timeMs: 0}).semantic.focusU;

const ends = variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => [0.43, 0.55, focusU, 0.85, 1].map(at => ({
  at, params: {...params, ...sa}, fn: 's.linkEnds.every(Boolean)', label: `every drawn connector starts and ends on its own part (${name}, ${shape}, t=${at})`,
}))));
// review round 1: no link runs through a part it does not connect (checked while drawn, with the focus part
// enlarged and gathered); every relation chip sits on or beside its own link, clear of parts, captions and other
// chips; the magnifier's caption is on a side no link uses
// review round 3: links land on a drawn group edge beside its caption (never through the caption or across the cord);
// no chip sits on a caption; a chip never hides more than half of its own link — in every frame sampled
const captions = variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => [0.35, 0.45, 0.55, 0.65, 0.72, 0.85, 1].map(at => ({
  at, params: {...params, ...sa},
  fn: 's.linksCrossLabels.length === 0 && s.chipsOnLabels.length === 0 && s.linksCrossCord.length === 0 && s.linksVisible',
  label: `links clear of captions and cord; chips off captions; links visible beside their chips (${name}, ${shape}) @${at}`,
}))));
const routing = variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => [0.43, focusU, 0.85, 1].map(at => ({
  at, params: {...params, ...sa}, fn: 's.linksThroughParts.length === 0 && s.chipsClear && s.captionClear && s.captionsWhole',
  label: `links pass no other part; chips on their own link and clear; captions clear and never broken mid-word (${name}, ${shape}, t=${at})`,
}))));
const hold = variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({
  at: 1, params: {...params, ...sa},
  fn: 's.closed && s.cordClear && JSON.stringify(s.insideLoop) === JSON.stringify(s.scopes.map(x => x === "included")) && s.linkLengths.every(v => v > 50) && !s.lupaOverCard',
  label: `hold: the transferred cord encloses exactly the covered cards; links keep a readable length; the magnifier lies on no card (${name}, ${shape})`,
})));

contractSuite('LAW-0118', {
  continuity: ['tracer', 'lupa'],
  semantic: [
    {at: 0, fn: 's.explode === 0 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.projected === 0', label: 'close together: no link, no tracer, no cord on the map'},
    {at: 0.18, fn: 's.explode === 1 && s.separated > 20 && s.relationsDrawn.every(p => p === 0)', label: 'separate: the parts stand apart before any link is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'links are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && s.projected === 0 && s.flags.every(v => v === 0)', label: 'all supplied links drawn before anything is transferred or marked'},
    {at: focusU, fn: "s.focus === 'outline' && s.focusScale > 1.25 && s.tracerVisible && s.tracerRadius >= 16", label: 'the focus part (the outline template) is clearly enlarged (≥ 1.25×) while the large tracer is on it'},
    {at: 0.55, fn: 'JSON.stringify(s.visited) === JSON.stringify(s.visitOrder.slice(0, s.visited.length)) && s.visited.length >= 1', label: 'the tracer visits the parts in the supplied order'},
    {at: 0.6, fn: 's.projected === 0', label: 'the outline is transferred only after the tracer has run'},
    {at: 0.7, fn: 's.projected > 0 && s.projected < 1 && !s.markersBeforeClose', label: 'transfer: the full-size cord draws itself on the map; no marker yet'},
    {at: 1, fn: "s.causalCount === 0 && JSON.stringify(s.linkKinds) === JSON.stringify(['relation', 'relation', 'sequence']) && JSON.stringify(s.arrowheads) === JSON.stringify([false, false, true])", label: 'relations carry no arrowhead and nothing is causal by default'},
    {at: 1, fn: 's.closed && s.flags.every(v => v === 1) && s.rings.every(v => v === 1) && s.gather === 1 && s.notesVisible && s.stateVisible && !s.tracerVisible && s.focusScale === 1', label: 'gather: origin (template), transformation (cord) and state (markers, key) stay visible'},
    {at: 1, params: {relationships: [{from: 'outline', to: 'included', kind: 'causal'}, {from: 'proposition', to: 'outline', kind: 'relation'}]}, fn: 's.causalCount === 1 && s.arrowheads[0] === true && s.arrowheads[1] === false && s.linkEnds.every(Boolean)', label: 'a causal style appears only when the author supplies it'},
    {at: 0.6, params: {traversalOrder: ['included', 'outline', 'proposition']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['included', 'outline', 'proposition'])", label: 'the tracer follows a different supplied order'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.closed && s.relationsDrawn.every(p => p === 1) && s.flags.every(v => v === 1)', label: 'labels hidden: the same mechanism and states are shown'},
    {at: 1, params: {facts: [{text: 'a', scope: 'not-examined'}, {text: 'b', scope: 'included'}, {text: 'c', scope: 'not-examined'}]}, fn: 'JSON.stringify(s.insideLoop) === JSON.stringify([false, true, false])', label: 'other supplied scopes: the transferred cord takes in exactly the covered card'},
    ...ends,
    ...routing,
    ...captions,
    ...hold,
  ],
});

// baseline floor: ~20 px (19 at 1:1, where the four parts share the square with the content notice)
suppliedTextSuite('LAW-0118', {
  baselineMin: 19,
  fields: 'const kinds = [...new Set(p.relationships.filter(r => r.from !== r.to).map(r => p.relationLabels[r.kind] || r.kind))]; return [...p.facts.map(f => f.text), p.rules.title, p.rules.proposition, ...p.issues, ...p.assumptions, ...p.elements.map(e => e.label), ...kinds];',
  content: 'return [...p.facts.map(f => f.text), p.rules.proposition, ...p.issues, ...p.assumptions];',
  captions: 'return [...p.elements.map(e => e.label), ...p.relationships.map(r => p.relationLabels[r.kind] || r.kind)];',
});
