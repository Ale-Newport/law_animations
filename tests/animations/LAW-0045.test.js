// LAW-0045 — Cita localizada · story. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0045', {
  continuity: ['card', 'handR', 'handL', 'book', 'strip', 'tokSource', 'tokVolume', 'tokPage', 'tokPara'],
  attach: [
    // the card never leaves the right hand while held (from taking it until
    // it is laid down); the book rides the left hand while pulled and
    // carried; the hand rides the cover's edge while it opens
    {from: 0.076, to: 0.394, a: 'handR', b: 'cardGrip', tol: 1.5},
    {from: 0.442, to: 0.578, a: 'handL', b: 'bookGrip', tol: 1.5},
    {from: 0.612, to: 0.668, a: 'handL', b: 'coverEdge', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.bookHolder === 'shelf' && s.split === 0 && s.highlight === 0 && !Object.values(s.landed).some(Boolean)", label: 'rest: book on the shelf, reference not yet decomposed'},
    {at: 0, fn: "s.armROut === 1 && !s.cardHeld", label: 'rest: the right hand is still off-stage (no clipped hand in the corner)'},
    {at: 0.12, fn: "s.armROut === 0 && s.cardHeld", label: 'the right hand has taken the card before presenting it'},
    {at: 0.5, fn: "s.armROut === 1 && !s.cardHeld", label: 'after laying the card down the right hand has left the stage'},
    {at: 0.32, fn: "s.split === 1 && s.bookHolder === 'shelf' && !s.landed.page && !s.landed.paragraph", label: 'the reference is split into its parts before anything moves'},
    {at: 0.43, fn: "s.landed.source && s.landed.volume && !s.landed.page && s.bookHolder === 'shelf'", label: 'source and volume parts land before the book is pulled (cause precedes effect)'},
    {at: 0.53, fn: "s.bookHolder === 'hand' && s.bookTurn > 0 && s.bookTurn < 1 && s.bookScale > 1", label: 'the book is carried and turns from spine to cover'},
    {at: 0.69, fn: "s.bookHolder === 'board' && s.bookOpen === 1 && s.highlight === 0", label: 'the book lies open on the board before the paragraph is marked'},
    {at: 1, fn: "s.highlight === 1 && s.landed.page && s.landed.paragraph && s.depth === 4", label: 'ends with the paragraph highlighted and every part at its place'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.highlight === 1 && s.bookOpen === 1 && s.landed.paragraph", label: 'the transformation completes identically with labels hidden'},
    {at: 1, params: {citations: [{source: 'Casebook of Examples', volume: 'Vol. 4', page: 'p. 112', paragraph: ''}]}, fn: "s.highlight === 0 && s.bookOpen === 1 && !s.landed.paragraph && s.missing.includes('paragraph') && s.depth === 3", label: 'incomplete reference: the route stops at the page'},
    {at: 1, params: {finalState: 'volume-retrieved'}, fn: "s.bookHolder === 'board' && s.bookOpen === 0 && !s.landed.page", label: 'supplied final state volume-retrieved: book laid down closed'},
    {at: 1, params: {pinpointRow: 5}, fn: "s.highlight === 1 && s.allReached", label: 'a pinpoint low on the page is reached and highlighted'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.split === 1 && !s.landed.volume && s.bookHolder === 'shelf'", label: 'actionProgress freezes the action part-way (split, nothing retrieved)'},
  ],
});
