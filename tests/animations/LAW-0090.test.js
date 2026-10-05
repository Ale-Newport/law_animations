// LAW-0090 — Distinción de casos · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the order does not change when
// seeking, and a relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

const IN_B = {facts: [
  {text: 'Lease signed for one year', icon: 'document', in: 'both'},
  {text: 'Rent paid every month', icon: 'calendar', in: 'both'},
  {text: 'Neighbour phoned in a complaint', icon: 'phone', in: 'b'},
  {text: 'Keys returned on day 30', icon: 'key', in: 'both'},
]};
const ALL_BOTH = {facts: [
  {text: 'Buyer signed the order form', icon: 'document', in: 'both'},
  {text: 'Goods delivered on day 3', icon: 'box', in: 'both'},
  {text: 'Price paid in cash', icon: 'coin', in: 'both'},
]};
const CAUSAL = {relationships: [
  {from: 'rule', to: 'caseA', kind: 'relation', label: 'stated on A'},
  {from: 'caseA', to: 'caseB', kind: 'relation', label: 'shared facts'},
  {from: 'caseB', to: 'lens', kind: 'relation', label: 'gap compared'},
  {from: 'lens', to: 'fact', kind: 'causal', label: 'causal (as supplied)'},
]};
const ORDER = '["rule","caseA","caseB","lens","fact"]';

contractSuite('LAW-0090', {
  continuity: ['tracer', 'carry'],
  semantic: [
    {at: 0, fn: 's.apart === 0 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.lensView === 0 && s.onStand === 0 && s.gapMarked === 0', label: 'separate: the strips start pressed together, no link drawn, nothing traced, empty stand'},
    {at: 0.17, fn: 's.apart === 1 && s.relationsDrawn.every(p => p === 0)', label: 'the parts are separated before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one after another'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later relationship never starts before the previous one is complete'},
    {at: 0.44, fn: "s.relationsDrawn.every(p => p === 1) && JSON.stringify(s.rungRows) === '[0,1,3]' && s.gapMarked === 1 && !s.tracerVisible", label: 'all supplied links drawn before the tracer runs; one rung per shared fact, the distinguishing row has none (broken link shown)'},
    {at: 1, fn: 's.connectorsLand && s.connectorEnds.length === 6', label: 'every connector (and every rung) starts and ends on its own element'},
    {at: 1, fn: "JSON.stringify(s.kinds) === '[\"relation\",\"relation\",\"relation\",\"sequence\"]' && JSON.stringify(s.arrowheads) === '[false,false,false,true]' && !s.arrowOnRelation", label: 'plain relations carry no arrowhead; only the supplied sequence link has one'},
    {at: 1, fn: "!s.kinds.includes('causal')", label: 'no causal link unless one is supplied'},
    {at: 1, params: CAUSAL, fn: "s.kinds[3] === 'causal' && s.arrowheads[3] && !s.arrowOnRelation", label: 'a supplied causal link is drawn as causal, the relations stay plain'},
    {at: 0.52, fn: `JSON.stringify(s.visitOrder) === '${ORDER}' && s.visited.length >= 1 && s.visited.length < 5 && s.visited.every((v, i) => v === s.visitOrder[i])`, label: 'the tracer visits the components in the supplied order'},
    {at: 0.9, fn: `JSON.stringify(s.visitOrder) === '${ORDER}' && s.visited.length === 5`, label: 'seeking later keeps the same order (seek order independent)'},
    {at: 0.58, fn: 's.lensView === 0 && s.onStand === 0 && s.focusScale === 1', label: 'the magnifier shows the gap row only once the tracer reaches it'},
    {at: 0.68, fn: "s.visited.includes('lens') && s.focusScale > 1.1 && s.lensView === 1", label: 'the focus element (magnifier) enlarges while the tracer is on it; its glass shows the gap row'},
    {at: 0.7, fn: 's.carried > 0 && s.carried < 1 && Math.hypot(s.carry.x - s.tracer.x, s.carry.y - s.tracer.y) < 1.5', label: 'the distinguishing token rides with the tracer along the sequence link'},
    {at: 1, fn: "!s.tracerVisible && s.onStand === 1 && s.lensView === 1 && s.diffRow === 2 && s.presentSide === 'a' && s.captionsClear && s.outcome === null", label: 'gather: origin, transformation and state stay visible; captions clear; no outcome'},
    {at: 0.62, params: {focusElement: 'caseB'}, fn: "s.focus === 'caseB'", label: 'the focus element is configurable'},
    {at: 0.9, params: {traversalOrder: ['caseB', 'caseA', 'rule']}, fn: "JSON.stringify(s.visitOrder) === '[\"caseB\",\"caseA\",\"rule\"]'", label: 'the tracer follows a supplied traversal order'},
    {at: 1, params: IN_B, fn: "s.presentSide === 'b' && s.diffRow === 2 && JSON.stringify(s.rungRows) === '[0,1,3]' && s.onStand === 1", label: 'a fact present only in B: strip B stands first and the gap is in strip A'},
    {at: 1, params: ALL_BOTH, fn: 's.diffRow === -1 && s.gapMarked === 0 && s.onStand === 0 && JSON.stringify(s.rungRows) === \'[0,1,2]\'', label: 'no distinguishing fact supplied: every row has a rung and the stand stays empty'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.onStand === 1 && s.gapMarked === 1 && s.lensView === 1', label: 'the mechanism completes with labels hidden'},
  ],
});
