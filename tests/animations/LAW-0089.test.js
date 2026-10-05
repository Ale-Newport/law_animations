// LAW-0089 — Distinción de casos · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuous motion, objects anchored to their holders, and the
// transformation (the differing fact lifted out by the magnifier) recognisable with
// labels hidden.
import {contractSuite} from '../harness/contract.js';

const ALL_BOTH = {facts: [
  {text: 'Buyer signed the order form', icon: 'document', in: 'both'},
  {text: 'Goods delivered on day 3', icon: 'box', in: 'both'},
  {text: 'Price paid in cash', icon: 'coin', in: 'both'},
]};
const IN_B = {facts: [
  {text: 'Lease signed for one year', icon: 'document', in: 'both'},
  {text: 'Neighbour phoned in a complaint', icon: 'phone', in: 'b'},
  {text: 'Keys returned on day 30', icon: 'key', in: 'both'},
]};
const near = (a, b, tol) => `Math.hypot(s.${a}.x - s.${b}.x, s.${a}.y - s.${b}.y) <= ${tol}`;

contractSuite('LAW-0089', {
  continuity: ['lens', 'hand', 'token'],
  attach: [
    // the extracted token rides in the glass from the capture to the drop into the clip
    {from: 0.501, to: 0.664, a: 'token', b: 'lens', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.tokenHolder === 'card' && s.scanned === 0 && s.links.every(v => v === 0) && s.clipClosed === 0 && s.absentMarked === 0", label: 'rest: token on its card, nothing compared yet, clip empty and open'},
    {at: 0, fn: near('lens', 'clipTok', 1.5), label: 'rest: the magnifier hovers over the empty clip'},
    {at: 0.065, fn: near('lens', 'clipTok', 1.5) + ' && s.scanned === 0', label: 'rest: the magnifier stays over the empty clip while the elements are presented'},
    {at: 0.22, fn: 's.links[3] === 1 && s.links[0] === 0 && s.scanned >= 1 && s.scanned < 4', label: 'the comparison runs bottom → top along the seam (rows below are linked first)'},
    {at: 0.425, fn: "s.scanned === 4 && s.links[0] === 1 && s.links[1] === 1 && s.links[3] === 1 && s.absentMarked === 1 && s.tokenHolder === 'card'", label: 'every row compared: shared rows linked, the differing row broken and its empty socket ringed, before anything moves'},
    {at: 0.495, fn: "s.tokenHolder === 'card' && " + near('lens', 'token', 2) + ' && s.lift < 0.05', label: 'the magnifier presses onto the distinguishing token before lifting it (cause before effect)'},
    {at: 0.56, fn: "s.tokenHolder === 'lens' && " + near('token', 'lens', 1.5) + ' && s.lift > 0.5 && s.ghost > 0', label: 'the token rides in the lifted glass; the card keeps a ghost of it'},
    {at: 0.7, fn: "s.tokenHolder === 'clip' && s.clipClosed === 1", label: 'the token is dropped into the clip and the jaws close'},
    {at: 1, fn: "s.tokenHolder === 'clip' && s.clipClosed === 1 && s.ghost === 1 && s.absentMarked === 1 && s.tagShown && s.stringStyle === 'plain'", label: 'hold: fact in the clip, ghost on card A, absent socket ringed, status tag shown'},
    {at: 1, fn: '!s.lensOnBoard', label: 'hold: the hand has taken the magnifier out of the board'},
    {at: 0.3, fn: 's.lensOnBoard && s.wrist <= 45', label: 'the handle stays in line with the forearm (wrist bend within 45°)'},
    {at: 0.56, fn: 's.wrist <= 45', label: 'wrist bend stays natural while carrying'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.tokenHolder === 'clip' && s.clipClosed === 1 && s.ghost === 1 && s.links[0] === 1", label: 'the same transformation completes with labels hidden'},
    {at: 1, params: {finalState: 'difference-disputed'}, fn: "s.stringStyle === 'disputed' && s.tokenHolder === 'clip'", label: 'supplied final state: the difference is marked disputed (dashed string), nothing decided'},
    {at: 0.3, params: {finalState: 'difference-disputed'}, fn: "s.stringStyle === 'plain'", label: 'the disputed marking is not shown before the hold'},
    {at: 1, params: ALL_BOTH, fn: "s.diffRow === -1 && s.tokenHolder === 'none' && s.links.every(v => v === 1)", label: 'no distinguishing fact supplied: every row links, nothing is extracted'},
    {at: 0.56, params: IN_B, fn: "s.diffSide === 'b' && s.tokenHolder === 'lens' && " + near('token', 'lens', 1.5), label: 'a fact present only in B is extracted from card B'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.tokenHolder === 'card' && s.scanned < 4", label: 'actionProgress freezes the action part-way'},
  ],
});
