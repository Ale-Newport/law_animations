// LAW-0683 — Cadena causal · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes, and no
// legal consequence is invented to complete the contrast (B stays unresolved).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0683', {
  continuity: ['bobA', 'bobB', 'a0', 'a1', 'a2', 'a3', 'a4', 'b0', 'b1', 'b2'],
  attach: [
    // at the strike instant the bob's surface meets the first tile's face
    {from: 0.4199, to: 0.4201, a: 'bobEdgeA', b: 'hitA', tol: 0.6},
  ],
  semantic: [
    {at: 0.1, fn: "JSON.stringify(s.a.angles) === JSON.stringify(s.b.angles) && s.a.lossState[0] === 'intact' && s.b.lossState[0] === 'intact' && s.barrierB === 0", label: 'base: two identical complete scenes'},
    {at: 0.35, fn: 's.ringShown && s.barrierB === 1 && s.a.angles.every(a => a === 0) && s.b.angles.every(a => a === 0)', label: 'change beat: the changed link is marked in both and the alternative appears in B, before anything moves'},
    {at: 0.46, fn: 'JSON.stringify(s.a.angles) === JSON.stringify(s.b.angles) && s.a.angles[0] > 0', label: 'parallel: identical physics until the changed link'},
    {at: 0.42, fn: 'Math.hypot(s.bobEdgeA.x - s.hitA.x, s.bobEdgeA.y - s.hitA.y) < 0.6 && JSON.stringify(s.bobA) === JSON.stringify(s.bobB) && s.a.angles.every(a => a === 0)', label: 'identical triggers: the bob touches the first tile exactly when it starts'},
    {at: 0.39, fn: 's.bobEdgeA.x < s.hitA.x - 1', label: 'the bob does not reach the tile before the strike'},
    {at: 1, fn: "s.a.lossState[0] === 'down' && s.a.started.every(Boolean)", label: 'A: the proposed chain continues to the loss'},
    {at: 1, fn: "s.b.started[s.changedLink] && !s.b.started[s.changedLink + 1] && s.b.lossState[0] === 'unresolved' && s.b.ghost === 1 && s.b.cracked[0] === 0", label: 'B: the chain reaches the disputed link; downstream shown unresolved (no break or hold asserted, no crack)'},
    {at: 1, fn: 's.a.angles.slice(0, s.changedLink).every((v, i) => v > 0) && s.b.angles.slice(0, s.changedLink + 1).every(v => v > 0)', label: 'upstream tiles fell in both scenes'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 1, params: {causalLinks: [{from: 3, status: 'disputed'}]}, fn: "s.changedLink === 3 && s.b.started[3] && s.b.lossState[0] === 'unresolved' && s.a.lossState[0] === 'down'", label: 'the changed link follows the supplied data'},
  ],
});
