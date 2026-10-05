// LAW-0049 — Historial de una norma · story. Contract battery + ID-specific checks.
// Acceptance (brief): continuity of motion, object anchoring, and the transformation
// must read with labels hidden (states are geometric: fan, card position, outline, ghosts).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0049', {
  continuity: ['handL', 'handR', 'volumeGrip', 'frontCorner', 'card', 'cardGrip'],
  attach: [
    // the volume follows the left hand from the pull off the shelf to the lectern
    {from: 0.341, to: 0.469, a: 'handL', b: 'volumeGrip', tol: 1.5},
    // the left hand drags the front sheet's corner while the layers fan out
    {from: 0.521, to: 0.589, a: 'handL', b: 'frontCorner', tol: 1.5},
    // the research card follows the right hand from pick-up to release on the rail
    {from: 0.521, to: 0.694, a: 'handR', b: 'cardGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.volumeHolder === 'shelf' && s.typed === 0 && s.fan === 0 && s.cardHolder === 'counter' && s.selected === null", label: 'rest: volume shelved, nothing typed, layers closed, card on the counter'},
    {at: 0.19, fn: "s.typed > 0 && s.typed < 1 && s.volumeHolder === 'shelf' && !s.located", label: 'the query is being typed before anything is located'},
    {at: 0.3, fn: "s.located && s.volumeHolder === 'shelf'", label: 'the kiosk locates the volume before the hand pulls it'},
    {at: 0.42, fn: "s.volumeHolder === 'L-carrying' && s.volumeTurn > 0 && s.volumeTurn < 1 && s.volumeScale > 0.4 && s.volumeScale < 1", label: 'the volume turns from spine to face while it is carried forward'},
    {at: 0.555, fn: "s.volumeHolder === 'lectern' && s.fan > 0 && s.fan < 1 && s.selected === null", label: 'temporal layers fan out on the lectern'},
    {at: 0.64, fn: "s.cardHolder === 'R-sliding' && s.selected === null && s.fan === 1", label: 'the card slides along the rail before any layer is outlined (cause before effect)'},
    {at: 1, fn: "s.selected === 1 && JSON.stringify(s.laterLayers) === '[2]' && s.cardHolder === 'rail' && Math.abs(s.card.y - s.cardTargetY) < 0.01", label: 'final: card clipped at the date, supplied layer outlined, later layer ghosted'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.selected === 1 && s.fan === 1 && s.cardHolder === 'rail'", label: 'with labels hidden the same geometric end state is reached'},
    {at: 1, params: {selectedVersion: 0}, fn: "s.selected === 0 && JSON.stringify(s.laterLayers) === '[1,2]'", label: 'the outlined layer is the one supplied by the author'},
    {at: 1, params: {finalState: 'versions-shown'}, fn: "s.fan === 1 && s.selected === null && s.cardHolder === 'counter'", label: 'versions-shown: layers fanned, no date marked'},
    {at: 1, params: {finalState: 'located'}, fn: "s.located && s.volumeHolder === 'shelf' && s.fan === 0", label: 'located: the volume stays on the shelf'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.volumeHolder === 'L-carrying' && s.actionCapped", label: 'actionProgress freezes the action part-way'},
  ],
});
