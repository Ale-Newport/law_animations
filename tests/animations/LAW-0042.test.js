// LAW-0042 — Búsqueda por términos · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the order does not
// change when seeking, and relation is not drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

// Every connector end lies on the edge of its port (not inside it, at most
// 16 units away), and every port belongs to its element: the card's posting
// line lies on the card, the shelf's empty slot lies in the shelf.
const LANDS = `s.connectorEnds.every(c => {
  const near = (p, b) => {
    const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w));
    const dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
    const inside = p.x > b.x + 1 && p.x < b.x + b.w - 1 && p.y > b.y + 1 && p.y < b.y + b.h - 1;
    return !inside && Math.hypot(dx, dy) <= 16;
  };
  const within = (a, b) => a.x >= b.x - 2 && a.y >= b.y - 2 && a.x + a.w <= b.x + b.w + 2 && a.y + a.h <= b.y + b.h + 2;
  return near(c.from, c.fromBox) && near(c.to, c.toBox) && within(c.fromBox, s.anchorBoxes[c.fromId]) && within(c.toBox, s.anchorBoxes[c.toId]);
})`;

contractSuite('LAW-0042', {
  continuity: ['tracer', 'strip', 'tokenA', 'tokenB'],
  semantic: [
    {at: 0, fn: 's.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.passageMarked === 0', label: 'starts separated: no relations, no tracer, passage unmarked'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all relations drawn before the tracer runs'},
    {at: 0.44, fn: 's.passageMarked === 0 && !s.postingLit', label: 'the passage and posting only change when the tracer passes'},
    {at: 1, fn: 's.passageMarked === 1 && s.postingLit && s.slotLit && s.shelfLit && !s.tracerVisible', label: 'gather: marked passage, lit posting, slot and shelf gap stay visible'},
    {at: 1, fn: LANDS, label: 'every connector ends on the edge of its element'},
    {at: 0.6, fn: LANDS, label: 'connectors stay anchored while the tracer runs'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['searchBox','term','card','passage','document','library'])", label: 'tracer follows the default traversal order'},
    {at: 0.6, params: {traversalOrder: ['library', 'document', 'passage', 'card']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['library','document','passage','card'])", label: 'tracer follows a supplied traversal order after seeking'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.kinds.filter(k => k === 'relation').length >= 3", label: 'plain relations are not drawn as causation by default'},
    {at: 1, params: {relationships: [{from: 'searchBox', to: 'term', kind: 'causal'}, {from: 'term', to: 'card', kind: 'sequence'}]}, fn: "s.kinds.includes('causal') && s.connectorEnds.length === 2", label: 'a causal link appears only when supplied'},
    {at: 1, fn: "s.matchKind === 'exact'", label: 'the tag states the kind of match only (descriptive)'},
    {at: 1, fn: 's.connectorEnds.every(c => c.len >= 90)', label: 'every connector has a readable length (no stubs)'},
    {at: 1, fn: 's.relationLabels.every(l => l && l.size === 28 && !l.truncated)', label: 'relation labels keep their full size and wording'},
    {at: 0.1, fn: 's.captionsShown.term === 0 && s.captionsShown.passage === 0 && s.captionsShown.card === 0', label: 'element captions do not appear before their elements'},
    {at: 0.25, fn: 'Object.values(s.captionsShown).every(v => v === 1) && s.elementsReady.term === 1 && s.elementsReady.card === 1 && s.elementsReady.passage === 1', label: 'captions shown once every element is in place'},
    {at: 1, fn: "s.connectorEnds.find(c => c.fromId === 'card' && c.toId === 'passage').fromBox.w < 20", label: 'the card lists the passage from its posting line (a port on the card edge)'},
  ],
});
