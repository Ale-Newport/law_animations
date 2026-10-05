// LAW-0026 — Traducción paralela · mechanism. Contract battery + ID-specific
// checks encoding the brief's acceptanceCheck: every connector ends at its
// element, the traversal order does not change with seeking, and a plain
// relation is never drawn as causation.
import {contractSuite} from '../harness/contract.js';

// connector end `p` lies on the boundary ring of box `b` (anchors sit a few units outside the edge)
const onEdge = '((p, b) => p.x >= b.x - 22 && p.x <= b.x + b.w + 22 && p.y >= b.y - 22 && p.y <= b.y + b.h + 22 && !(p.x > b.x + 22 && p.x < b.x + b.w - 22 && p.y > b.y + 22 && p.y < b.y + b.h - 22))';

contractSuite('LAW-0026', {
  continuity: ['tracer', 'sourceStrip', 'translationStrip'],
  semantic: [
    {at: 0, fn: 's.lifted === 0 && s.slotFill === 0 && !s.tracerVisible && s.relationsDrawn.every(v => v === 0)', label: 'separate: strips still in their pages, nothing related yet'},
    {at: 0.18, fn: 's.lifted === 1 && s.relationsDrawn.every(v => v === 0)', label: 'both strips are lifted out before relations are drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(v => v > 0) && s.relationsDrawn.some(v => v < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(v => v === 1) && s.tracerVisible', label: 'all relations drawn before the tracer runs'},
    {at: 0.44, fn: 's.slotFill === 0', label: 'the term slot changes only when the tracer reaches the translated segment'},
    {at: 1, fn: 's.slotFill === 1 && s.filed && !s.tracerVisible', label: 'gather: equivalent in place, sheets filed, tracer gone'},
    {at: 1, fn: `s.connectorEnds.every(c => ${onEdge}(c.a, s.elementBoxes[c.from]) && ${onEdge}(c.b, s.elementBoxes[c.to]))`, label: 'every connector starts and ends on the edge of its own element'},
    {at: 1, fn: "s.relationKinds.every((k, i) => (k === 'relation') === !s.arrows[i]) && !s.relationKinds.includes('causal')", label: 'plain relations carry no arrowhead and nothing is causal by default'},
    {at: 1, fn: 's.labelsClear', label: 'every relation label sits beside its own connector, clear of every connector path and of the parts at their focus size'},
    {at: 1, params: {locale: 'es', termStatus: 'unconfirmed'}, fn: 's.labelsClear', label: 'labels stay clear with Spanish interface strings and an unconfirmed term'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['source','segment','record','translation','target','folder'])", label: 'tracer follows the default traversal order'},
    {at: 0.6, params: {traversalOrder: ['folder', 'target', 'translation', 'segment']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','target','translation','segment'])", label: 'tracer follows a supplied traversal order'},
    {at: 1, params: {termStatus: 'unconfirmed'}, fn: "s.termStatus === 'unconfirmed' && s.slotFill === 1", label: 'unconfirmed term: the slot keeps the source term with a question mark'},
    {at: 1, params: {relationships: [{from: 'segment', to: 'translation', kind: 'causal', label: 'supplied as causal'}]}, fn: 's.arrows[0] === true && s.relationKinds[0] === "causal"', label: 'a causal arrow appears only when the author supplies it'},
  ],
});
