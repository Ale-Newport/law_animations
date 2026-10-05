// LAW-0061 — Fuente primaria y comentario · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, anchored objects (card held by the solved hand,
// eyelet hooked on the source pin, pin pressed under the hand) and a transformation
// that reads with labels hidden (card beside the page, thread across the gutter).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0061', {
  continuity: ['hand', 'noteCenter', 'noteGrip', 'port'],
  attach: [
    // the researcher's hand holds the card's grip until it is laid in the margin column
    {from: 0, to: 0.578, a: 'hand', b: 'noteGrip', tol: 1.5},
    // the card's eyelet sits on the source pin while it is hooked there
    {from: 0.401, to: 0.439, a: 'port', b: 'sourcePin', tol: 1.5},
    // the hand is on the pin spot while the pin is pressed
    {from: 0.632, to: 0.679, a: 'hand', b: 'pinSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.holder === 'researcher' && !s.threadTied && !s.notePinned && s.passageHighlighted === 0 && s.bracket === 0", label: 'starts with the card in hand, nothing linked'},
    {at: 0.3, fn: "s.holder === 'researcher' && s.passageHighlighted > 0 && !s.threadTied && s.cardClearOfPage", label: 'the found passage lights up before the card arrives'},
    {at: 0.42, fn: "s.threadTied && s.bracket === 1 && Math.hypot(s.port.x - s.sourcePin.x, s.port.y - s.sourcePin.y) < 1.5 && s.cardClearOfPage", label: 'the tab eyelet is hooked on the pin at the bracketed passage; the card does not cover the page'},
    {at: 0.52, fn: "s.holder === 'researcher' && s.threadTied && s.threadLength > 20 && s.cardClearOfPage", label: 'the card is pulled back across the gutter; the thread pays out'},
    {at: 0.66, fn: "s.holder === 'board' && s.notePinned", label: 'the card is pinned in the margin column under the hand'},
    {at: 1, fn: "s.holder === 'board' && s.threadTied && s.notePinned && s.gutterGap > 60 && s.cardClearOfPage && s.searchLinked === 1 && s.allReached && s.finalState === 'linked'", label: 'ends linked by the thread, not merged (gap between page and card)'},
    {at: 1, fn: 's.threadLength >= 120', label: 'the thread across the gutter is long enough to read as a link between two separate sheets'},
    {at: 1, params: {finalState: 'placed'}, fn: "s.notePinned && !s.threadTied && s.bracket === 0 && s.searchLinked === 0 && s.gutterGap > 60", label: 'placed state: pinned beside the page, no thread, no bracket'},
    {at: 1, params: {finalState: 'held'}, fn: "s.holder === 'researcher' && !s.notePinned && !s.threadTied", label: 'held state: the card stays in the researcher’s hand'},
    {at: 1, params: {citations: {passage: 3}}, fn: 's.linkedPassage === 3 && s.threadTied', label: 'the thread goes to the passage supplied by the author'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && !s.notePinned && s.holder === 'researcher'", label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.threadTied && s.notePinned && s.cardClearOfPage", label: 'the action is identical with labels hidden'},
  ],
});
