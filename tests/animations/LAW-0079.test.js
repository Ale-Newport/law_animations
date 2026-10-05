// LAW-0079 — Trazabilidad de una cita · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (whether the original
// itself is opened), and no legal consequence is invented to complete the contrast.
// Windows (u): A toLid 0.18–0.24, lidOpen 0.24–0.31, lidBack (hand to the box rim) 0.31–0.38;
// B ghost 0.24–0.36; chain1 (both) 0.41–0.52; A toBox 0.53–0.58, lift 0.58–0.62, present
// 0.62–0.68, chain2 0.58–0.74; close-ups of the card's third row 0.775–0.81.
// Both right hands rest on the counter in view; A's never leaves the panel.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0079', {
  continuity: ['aHand', 'bHand', 'aFolioTop', 'bFolioTop', 'aClasp1', 'bClasp1', 'aClasp2', 'aHandL', 'bHandL'],
  attach: [
    // A's fingers ride the lid's front edge while it swings open
    {from: 0.241, to: 0.309, a: 'aHand', b: 'aLidEdge', tol: 1.5},
    // A's original follows the hand from the grip to the hold
    {from: 0.581, to: 1, a: 'aHand', b: 'aFolioGrip', tol: 1.5},
    // both cards stay in their left hands
    {from: 0, to: 1, a: 'aHandL', b: 'aCardGrip', tol: 1.5},
    {from: 0, to: 1, a: 'bHandL', b: 'bCardGrip', tol: 1.5},
    // A's second chain ends on the cited entry once it arrives
    {from: 0.742, to: 1, a: 'aClasp2', b: 'aFolioHook', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.lidOpen === 0 && s.b.lidOpen === 0 && s.sameBook && s.sameFolio && s.a.folioHolder === 'box' && s.b.folioHolder === 'box' && s.ghostB === 0 && s.cardRowsA.every(v => v === 0) && s.cardRowsB.every(v => v === 0)", label: 'identical base situation in both scenes'},
    {at: 0.3, fn: 's.a.lidOpen > 0 && s.b.lidOpen === 0 && s.ghostB > 0 && s.a.chain1 === 0 && s.b.chain1 === 0', label: 'the change is local: A opens the lid, B only gains a dashed cited-in link'},
    {at: 0.46, fn: 's.sameChain1 && s.a.chain1 > 0 && s.a.chain1 < 1', label: 'the first chain runs identically in parallel'},
    {at: 0.53, fn: "JSON.stringify(s.a.chainStops) === JSON.stringify(['note','intermediate']) && JSON.stringify(s.b.chainStops) === JSON.stringify(['note','intermediate'])", label: 'both reach the intermediate reference'},
    {at: 0.65, fn: "s.a.folioHolder === 'hand' && s.b.folioHolder === 'box' && s.b.lidOpen === 0", label: 'only A takes the original out'},
    {at: 1, fn: "JSON.stringify(s.a.chainStops) === JSON.stringify(['note','intermediate','source']) && JSON.stringify(s.b.chainStops) === JSON.stringify(['note','intermediate']) && s.a.lidOpen === 1 && s.b.lidOpen === 0 && s.b.chain2 === 0", label: 'A ends on the original entry; B ends at the intermediate with the box closed'},
    {at: 1, fn: 's.cardRowsA.every(v => v === 1) && s.cardRowsB.every(v => v === 1) && s.guideProgress === 1 && s.allReached', label: 'both cards record three stops (B’s third as cited); guide drawn; hands within reach'},
    {at: 0.1, fn: 's.sameHandAtRest && s.a.handInView && s.b.handInView', label: 'both right hands rest identically on the counter, in view'},
    {at: 0.2, fn: 's.a.handInView', label: 'A’s hand reaches for the lid inside the panel'},
    {at: 0.35, fn: "s.a.handInView && s.a.holderR === 'free' && s.a.lidOpen === 1", label: 'after opening the lid the hand stays on the box rim (it never leaves the panel)'},
    {at: 0.52, fn: 's.a.handInView', label: 'A’s hand is still in view before it lifts the original'},
    {at: 1, fn: 's.a.handInView && s.b.handInView && s.insets === 1', label: 'hold: hands in view; each card’s third row is shown close up'},
    {at: 0.7, fn: 's.insets === 0', label: 'the close-ups appear only after the third row is recorded'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.a.folioHolder === 'hand' && s.b.folioHolder === 'box'", label: 'labels hidden: the same difference is visible'},
  ],
});
