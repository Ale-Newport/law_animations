// LAW-0100 — Condiciones acumulativas · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the enlarged detail keeps its source coordinates (the lens is a
// second copy of the same board drawn at the same coordinates; its window keeps the
// source's aspect), the change is local (only piece k, its two mesh contacts and the
// dependent dial change) and seeking back restores the previous datum exactly.
import {contractSuite} from '../harness/contract.js';

const others = "s.contextPieces.filter((p, i) => i !== s.focusPiece - 1).every(p => p === 'seated')";

contractSuite('LAW-0100', {
  // the reading glass, the lens window and both copies of the inspected piece never jump
  continuity: ['glass', 'lensWin', 'pieceK', 'lensPiece'],
  attach: [
    // the rim of the reading glass frames the lens window while it opens, holds and closes
    {from: 0.356, to: 0.859, a: 'glass', b: 'lensWin', tol: 0.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextStatus === 'supplied' && s.glassAtRest && s.noteShown", label: 'build: the board as supplied, the glass at rest, the issue note pinned'},
    {at: 0.2, fn: 's.dial === 1 && s.dialLamp && s.completeBefore && ' + others, label: 'build: after the test turn every piece is seated and the joint dial is at its end'},
    {at: 0.3, fn: "s.lensOpen === 0 && !s.glassAtRest && s.contextStatus === 'supplied'", label: 'isolate: the glass travels to the pocket before any enlargement'},
    {at: 0.45, fn: "s.lensOpen === 1 && s.datum === 'before' && s.lensStatus === 'supplied' && s.contextDim === 1", label: 'isolate: lens fully open on the unchanged piece; context dimmed'},
    {at: 0.45, fn: 's.sourceContains && s.sameAspect && s.destClear && s.lensZoom >= 1.8', label: 'the lens is a real enlargement of the pocket region (same coordinates, same aspect, ≥1.8×), placed clear of its source'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensStatus === 'changing' && s.contextStatus === 'supplied' && s.contextMesh.every(Boolean)", label: 'substitute: the datum changes inside the lens only; the context keeps the old one'},
    {at: 0.72, fn: "s.lensStatus === 'pending' && s.lensMesh.every(m => !m) && s.contextStatus === 'supplied' && s.dial === 1", label: 'substitute: in the lens the piece is out and both mesh contacts are split'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextStatus === 'pending' && s.contextDatum === 'after' && s.contextMesh.every(m => !m) && s.dial === 0 && !s.dialLamp && s.tag === 'after' && s.markerShown && s.glassAtRest", label: 'return: the context shows the new datum, the dial springs back, marker shown, glass laid down'},
    {at: 1, fn: others, label: 'the change is local: every other piece stays seated'},
    {at: 0.3, fn: "s.contextStatus === 'supplied' && s.lensStatus === 'supplied' && s.datum === 'before' && s.dial === 1", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'supplied'}, {label: 'c', status: 'pending'}, {label: 'd', status: 'supplied'}], rules: {name: 'Rule G-4 (fictional)', conditions: ['A', 'B', 'C', 'D']}, focusPiece: 3, afterStatus: 'supplied', beforeValue: 'Pending', afterValue: 'Supplied'},
      fn: "s.statusBefore === 'pending' && s.contextStatus === 'supplied' && s.completeAfter && s.dial === 1 && s.dialLamp && s.thetaAfter > 0 && s.contextMesh.every(Boolean)", label: 'reverse substitution (pending → supplied): the piece slides in and a new test turn carries the dial to its end'},
    {at: 0.2, params: {facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'supplied'}, {label: 'c', status: 'pending'}, {label: 'd', status: 'supplied'}], rules: {name: 'Rule G-4 (fictional)', conditions: ['A', 'B', 'C', 'D']}, focusPiece: 3, afterStatus: 'supplied'},
      fn: "s.contextStatus === 'pending' && s.dial === 0 && !s.completeBefore", label: 'reverse substitution: before the change the pocket is empty and the dial stays at its open end'},
    {at: 1, params: {afterStatus: 'disputed', afterValue: 'Disputed: not resolved here'}, fn: "s.contextStatus === 'disputed' && s.contextMesh.every(m => !m) && s.dial === 0", label: 'supplied → disputed: the piece stays unseated, contacts split, nothing is resolved'},
    {at: 1, params: {focusTarget: 'fact', focusPiece: 1, beforeValue: 'Form signed on Day 2', afterValue: 'Form signed on Day 3'}, fn: "s.contextFact === 'after' && s.contextStatus === 'supplied' && s.dial === 1 && s.dialLamp && s.contextMesh.every(Boolean)", label: 'fact substitution: only the printed fact changes; the board stays complete'},
    {at: 0.72, params: {focusTarget: 'fact', focusPiece: 1, beforeValue: 'Form signed on Day 2', afterValue: 'Form signed on Day 3'}, fn: "s.lensFact === 'after' && s.contextFact === 'before'", label: 'fact substitution: the lens changes first, the context keeps the old text'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.contextStatus === 'pending' && s.dial === 0 && s.markerShown", label: 'labels hidden: the same substitution and marker happen'},
  ],
});
