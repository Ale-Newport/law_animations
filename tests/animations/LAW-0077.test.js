// LAW-0077 — Trazabilidad de una cita · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, anchored objects (book and original follow the
// solved right hand, the card follows the solved left hand, each chain clasp ends on the
// next eyelet) and a transformation that reads with labels hidden.
// Windows (u): pull 0.22–0.25, carry 0.25–0.33, release 0.33–0.36, open 0.36–0.42 (the hand
// rides the cover edge until open = 0.55 → u 0.393), away (back to the counter) 0.393–0.45,
// chain1 0.16–0.42, toBox 0.45–0.52, lift 0.52–0.57, present 0.57–0.64, chain2 0.50–0.68.
// The right hand rests on the counter in view (it never crosses the frame edge alone).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0077', {
  continuity: ['handR', 'handL', 'bookCenter', 'bookGrip', 'folioTop', 'folioGrip', 'clasp1', 'clasp2'],
  attach: [
    // the right hand carries the book by its hinge while pulling and carrying it
    {from: 0.222, to: 0.328, a: 'handR', b: 'bookGrip', tol: 1.5},
    // the hand rides the cover's free edge until the cover passes vertical
    {from: 0.362, to: 0.39, a: 'handR', b: 'coverEdge', tol: 1.5},
    // the original follows the hand from the grip to the hold
    {from: 0.522, to: 1, a: 'handR', b: 'folioGrip', tol: 1.5},
    // the left hand holds the card throughout
    {from: 0, to: 1, a: 'handL', b: 'cardGrip', tol: 1.5},
    // clasps sit on their eyelets once they arrive
    {from: 0.422, to: 1, a: 'clasp1', b: 'inHook', tol: 1.5},
    {from: 0.682, to: 1, a: 'clasp2', b: 'folioHook', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.chain1 === 0 && s.chain2 === 0 && s.bookHolder === 'shelf' && s.folioHolder === 'box' && s.cardRows.every(v => v === 0)", label: 'rest: book in its slot, original in its box, no chain, empty card'},
    {at: 0.14, fn: "s.chain1 === 0 && s.bookHolder === 'shelf'", label: 'nothing moves before the action beat'},
    {at: 0.2, fn: "s.chain1 > 0 && s.chain1 < 1 && s.cardRows[0] > 0 && s.bookHolder === 'shelf'", label: 'the chain starts at the note first (row 1 recorded)'},
    {at: 0.3, fn: "s.bookHolder === 'hand' && s.holderR === 'book' && Math.hypot(s.handR.x - s.bookGrip.x, s.handR.y - s.bookGrip.y) < 1.5", label: 'the book travels in the solved hand'},
    {at: 0.4, fn: "s.bookHolder === 'cradle' && s.bookOpen > 0.5 && s.chain1 < 1", label: 'the book is set down and opened before the chain arrives'},
    {at: 0.45, fn: "s.chain1 === 1 && JSON.stringify(s.chainStops) === JSON.stringify(['note','intermediate']) && Math.hypot(s.clasp1.x - s.inHook.x, s.clasp1.y - s.inHook.y) < 1.5 && s.chain2 === 0", label: 'first chain lands on the intermediate’s eyelet; the second has not started'},
    {at: 0.5, fn: "s.folioHolder === 'box' && s.chain2 === 0", label: 'the original is still in its box when the hand reaches it'},
    {at: 0.6, fn: "s.folioHolder === 'hand' && s.chain2 > 0 && s.chain2 < 1", label: 'the original is lifted out while the second chain runs toward it'},
    {at: 1, fn: "JSON.stringify(s.chainStops) === JSON.stringify(['note','intermediate','source']) && s.cardRows.every(v => v === 1) && Math.hypot(s.clasp2.x - s.folioHook.x, s.clasp2.y - s.folioHook.y) < 1.5 && s.allReached", label: 'hold: chain note → intermediate → source, card complete, hands within reach'},
    {at: 1, params: {finalState: 'intermediate-only'}, fn: "JSON.stringify(s.chainStops) === JSON.stringify(['note','intermediate']) && s.folioHolder === 'box' && s.chain2 === 0 && s.holderR === 'free'", label: 'supplied state intermediate-only: the original stays unopened, the chain ends at the intermediate'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.chain1 < 1 && s.chain2 === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0, fn: 's.handRInView && s.holderR === "free"', label: 'the right hand starts resting on the counter, in view'},
    {at: 0.46, fn: 's.handRInView', label: 'between the book and the box the hand returns to the counter (never leaves the frame)'},
    {at: 0.5, fn: 's.handRInView', label: 'the hand approaches the original in view'},
    {at: 1, fn: 's.handRInView', label: 'the hand holding the original is in view'},
    {at: 0.49, params: {finalState: 'intermediate-only'}, fn: 's.handRInView', label: 'intermediate-only: the returning hand stays in view'},
    {at: 1, params: {finalState: 'intermediate-only'}, fn: 's.handRInView', label: 'intermediate-only: the hand rests on the counter at the hold'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.chainStops) === JSON.stringify(['note','intermediate','source']) && s.folioHolder === 'hand'", label: 'labels hidden: the same physical trail is made'},
    {at: 1, params: {citations: {noteNumber: '12', pinpoint: 'p. 88', innerNote: '3', folio: 'fol. 14', entry: '1', shelfMark: 'B·3'}}, fn: 's.folioHook.y < s.folioGrip.y + 150', label: 'the entry parameter moves the chain end to the first entry of the original'},
  ],
});
