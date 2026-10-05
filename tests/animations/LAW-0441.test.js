// LAW-0441 — Oferta comunicada · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, anchored objects (sheet held by solved
// hands, shared catch point) and a transformation that reads with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0441', {
  continuity: ['sheetCenter', 'handA', 'handB'],
  attach: [
    // A holds the sheet by the left edge of its middle panel until release
    {from: 0, to: 0.388, a: 'handA', b: 'gripA', tol: 1.5},
    // B's hand meets the mailer at the catch point and holds it to the end
    {from: 0.562, to: 1, a: 'handB', b: 'gripB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.holder === 'A' && s.folded === 0 && s.opened === 0 && !s.sealed", label: 'starts open in the offeror\'s hand'},
    {at: 0.3, fn: "s.holder === 'A' && s.folded === 1 && s.sealed", label: 'folded into its own mailer and sealed before sending'},
    {at: 0.47, fn: "s.holder === 'in-transit' && s.routeDrawn > 0 && s.routeDrawn < 1 && s.flight > 0", label: 'travels along the route (trail revealed behind it)'},
    {at: 0.56, fn: "s.holder === 'B' && Math.hypot(s.handB.x - s.gripB.x, s.handB.y - s.gripB.y) < 1.5", label: 'hand and mailer meet at the shared catch point'},
    {at: 0.645, fn: "s.holder === 'B' && s.opened > 0 && s.opened < 0.5 && !s.sealed", label: 'seal is broken before the sheet opens'},
    {at: 1, fn: "s.holder === 'B' && s.opened === 1 && s.folded === 0 && s.finalState === 'opened' && s.allReached", label: 'ends open in the offeree\'s hand'},
    {at: 1, params: {finalState: 'delivered'}, fn: "s.holder === 'B' && s.opened === 0 && s.sealed", label: 'delivered state: received but still sealed'},
    {at: 1, params: {finalState: 'in-transit'}, fn: "s.holder === 'in-transit' && s.routeDrawn === 0.55", label: 'in-transit state: stops part-way, never reaches B'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.holder === 'A' && s.actionCapped", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.holder === 'B' && s.opened === 1", label: 'the action is identical with labels hidden'},
  ],
});
