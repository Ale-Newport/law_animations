// LAW-0041 — Búsqueda por términos · story. Contract battery + ID-specific checks.
// acceptanceCheck: motion continuity, object anchoring, and a transformation
// that is recognisable with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0041', {
  // tokens (word pills), the typing hand and the printed card must never jump
  continuity: ['tokenA', 'tokenB', 'tokenC', 'tokenD', 'handNear', 'cardTop'],
  attach: [
    // the hand is on the keys (solved IK = target) while typing
    {from: 0.16, to: 0.27, a: 'handNear', b: 'handTarget', tol: 1.5},
    // after its travel the first token rests exactly on its tab (thread end)
    {from: 0.455, to: 1, a: 'tokenA', b: 'endA', tol: 1},
    {from: 0.53, to: 1, a: 'tokenB', b: 'endB', tol: 1},
  ],
  semantic: [
    {at: 0, fn: 's.typed === 0 && s.marked === 0 && s.cardLines === 0 && s.allReached', label: 'rest: empty search box, nothing linked, no card'},
    {at: 0.22, fn: 's.typed > 0 && s.typed < 1 && s.marked === 0 && s.links.every(l => l.travel === 0)', label: 'the query is typed before any word travels'},
    {at: 0.45, fn: 's.links.some(l => l.travel > 0 && l.travel < 1) && s.marked < s.linkCount', label: 'word tokens travel along threads before passages are marked (cause before effect)'},
    {at: 0.45, fn: 's.links.every(l => l.mark === 0 || l.travel === 1)', label: 'a passage is only highlighted after its token has arrived'},
    {at: 1, fn: 's.marked === s.linkCount && s.linkCount >= 3 && s.linkedSources.length >= 2', label: 'query words end linked to passages in several volumes'},
    {at: 1, fn: 's.cardLines === s.linkCount && s.cardTop !== null', label: 'the index card lists one line per linked passage'},
    {at: 1, fn: "s.links.every(l => l.kind === 'exact')", label: 'default exact mode links only literal words'},
    {at: 1, params: {query: {terms: [{text: 'notice', related: ['notified', 'informed']}, {text: 'delivery', related: ['shipment', 'delivered']}], mode: 'contextual'}}, fn: "s.links.some(l => l.kind === 'contextual') && s.marked === s.linkCount", label: 'contextual mode also links the supplied related wording'},
    {at: 1, params: {finalState: 'not-run'}, fn: 's.typed === 1 && s.marked === 0 && s.links.every(l => l.travel === 0)', label: 'not-run state: query typed, nothing linked'},
    {at: 1, params: {finalState: 'highlighted'}, fn: 's.marked === s.linkCount && s.cardTop === null', label: 'highlighted state: passages marked, no card printed'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.marked < s.linkCount', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.marked === s.linkCount && s.cardLines === s.linkCount', label: 'with labels hidden the same links, tabs and highlights are produced'},
  ],
});
