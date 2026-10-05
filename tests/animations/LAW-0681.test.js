// LAW-0681 — Cadena causal · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchoring (the fingertip on the
// first tile, each tile only moving once the previous one touches it) and a
// transformation that stays recognizable with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0681', {
  continuity: ['hand', 'pushGrip', 'tile0', 'tile1', 'tile2', 'tile3', 'loss0'],
  attach: [
    // the presenter's fingertip rides on the first tile while pushing it
    {from: 0.1605, to: 0.19, a: 'hand', b: 'pushGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.angles.every(a => a === 0) && s.lossState[0] === 'intact' && !s.handOnTile", label: 'rest: every tile upright, loss intact, hand at rest'},
    {at: 0.14, fn: 's.angles.every(a => a === 0) && s.gaps.every(d => d > 20)', label: 'nothing moves before the push; tiles stand apart'},
    {at: 0.17, fn: 's.handOnTile && s.angles[0] > 0 && s.angles.slice(1).every(a => a === 0)', label: 'the push starts the first tile only'},
    {at: 0.3, fn: 's.started.every((st, i) => i === 0 || !st || Math.abs(s.gaps[i - 1]) <= 0.6)', label: 'a tile has started only if the previous tile touches it (contact geometry)'},
    {at: 0.3, fn: 's.started.some(x => !x) && s.started.every((st, i) => i === 0 || !st || s.started[i - 1])', label: 'the chain advances in the supplied order (no tile starts before its predecessor)'},
    {at: 0.45, fn: 's.gaps.every(d => d > -0.6)', label: 'leaning tiles never interpenetrate'},
    {at: 0.62, fn: "JSON.stringify(s.startOrder) === JSON.stringify([0, 1, 2, 3, 4])", label: 'start order equals the supplied order, loss last'},
    {at: 0.52, fn: "s.lossState[0] === 'intact' && s.cracked[0] === 0", label: 'the loss is untouched until the last tile reaches it (cause precedes visible effect)'},
    {at: 1, fn: "s.lossState[0] === 'down' && s.cracked[0] === 1 && s.started.every(Boolean) && s.joints.every(j => j !== null)", label: 'final hold: every link made, loss tipped and cracked'},
    {at: 1, params: {finalState: 'unresolved-at-disputed-link', causalLinks: [{from: 1, status: 'disputed'}]}, fn: "s.stopLink === 1 && s.started[0] && s.started[1] && !s.started[2] && !s.started[3] && s.lossState[0] === 'unresolved' && s.ghost === 1", label: 'unresolved state: the chain holds at the disputed link; downstream neither fallen nor standing'},
    {at: 1, params: {finalState: 'unresolved-at-disputed-link', causalLinks: [{from: 1, status: 'disputed'}]}, fn: "s.touching[1] && s.gaps[1] > -0.6 && s.angles[2] === 0", label: 'unresolved state: the held tile rests on the (dimmed, still standing) next tile, not on air'},
    {at: 1, params: {actionProgress: 0.35}, fn: "s.lossState[0] === 'intact' && s.started[0] && !s.started.every(Boolean)", label: 'actionProgress freezes the chain part-way'},
    {at: 1, params: {events: [{label: 'A'}, {label: 'B'}, {label: 'C'}, {label: 'D'}, {label: 'E'}, {label: 'F'}]}, fn: "s.started.length === 7 && s.started.every(Boolean) && JSON.stringify(s.startOrder) === '[0,1,2,3,4,5,6]'", label: 'six supplied events: all topple in order'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.lossState[0] === 'down' && s.joints.every(j => j !== null)", label: 'labels hidden: the same physical transformation happens'},
  ],
});
