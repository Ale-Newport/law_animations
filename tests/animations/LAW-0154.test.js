// LAW-0154 — Interpretaciones concurrentes · mechanism. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: every connector ends on its element, the traversal order
// is kept under seeking, and a relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

contractSuite('LAW-0154', {
  continuity: ['tracer', 'passage'],
  semantic: [
    {at: 0.17, fn: 's.drawn.every(p => p === 0) && s.visited.length === 0', label: 'separate: no relationship is drawn before the elements are in place'},
    {at: 0.43, fn: 's.appeared && s.drawn.every(p => p === 1) && s.visited.length === 0 && s.bands.every(b => b === 0)', label: 'relate: every supplied relationship is drawn before the tracer starts; no pattern yet'},
    {at: 1, fn: 's.connectorsLand && s.hiddenLabels === 0', label: 'every connector ends on the edge of its own element; every caption is placed'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.kinds.every((k, i) => s.arrows[i] === (k !== 'relation'))", label: 'no causal link by default; plain relations carry no arrowhead'},
    {at: 0.6, fn: 's.visited.length > 0 && s.visited.every((id, i) => id === s.order[i])', label: 'the tracer visits the elements in the supplied order (prefix while running)'},
    {at: 0.45, fn: 's.focusScale === 1 && s.lensBands.every(b => b.opacity === 0)', label: 'the lens grows and shows the two patterns only once the tracer gets there'},
    {at: 1, fn: 'JSON.stringify(s.visited) === JSON.stringify(s.order) && s.focusScale > 1 && s.lensBands.every(b => b.opacity > 0) && s.bands.every(b => b === 1) && s.bandsDiffer && s.keyShown', label: 'gather: full order visited, focus enlarged, both lens patterns and both (different) overlay patterns drawn, key shown'},
    // review fixes: A and B are introduced together; the lens bands get one identical treatment
    ...[0, 0.03, 0.06, 0.09, 0.1, 0.12, 0.14, 0.16, 0.18].map(u => ({at: u, fn: 's.appear.A === s.appear.B', label: `u=${u}: reading A and reading B are introduced together (neither alone on screen)`})),
    ...[0.55, 0.6, 0.7, 1].map(u => ({at: u, fn: 's.lensBands[0].opacity === s.lensBands[1].opacity && s.lensBands[0].h === s.lensBands[1].h && Math.abs(s.lensBands[0].len - s.lensBands[1].len) < 0.5 && Math.abs(s.lensBands[0].contrast - s.lensBands[1].contrast) <= 0.03', label: `u=${u}: the lens bands of A and B have the same opacity, height, length and contrast against the glass`})),
    {at: 1, params: {relationships: [{from: 'passage', to: 'lens', kind: 'causal'}, {from: 'lens', to: 'readingA', kind: 'relation'}, {from: 'lens', to: 'readingB', kind: 'relation'}]}, fn: "s.kinds[0] === 'causal' && s.arrows[0] === true && s.arrows[1] === false && s.connectorsLand", label: 'a causal arrow appears only when the author supplies a causal relationship'},
    {at: 1, params: {focusElement: 'board', traversalOrder: ['board', 'book', 'passage', 'lens', 'readingB', 'readingA']}, fn: "s.focus === 'board' && s.focusScale > 1 && JSON.stringify(s.visited) === JSON.stringify(['board', 'book', 'passage', 'lens', 'readingB', 'readingA']) && s.connectorsLand", label: 'focus element and traversal order follow the parameters'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.connectorsLand && s.bands.every(b => b === 1) && s.bandsDiffer && s.focusScale > 1', label: 'the mechanism completes identically with labels hidden'},
  ],
});

// every preset × real ratio × labels shown/hidden
ratioChecks('LAW-0154', 'layout fits; connectors land; captions on their own connectors', [
  {at: [0.44, 1], fn: 's.fits && s.connectorsLand && s.labelsClear && s.labelsOnConnectors && s.hiddenLabels === 0', label: 'every connector ends on its element; every caption sits on its own connector, clear of elements and other captions'},
  // equal weight (legal): identical overlay style, card / block size, band luminance, lens band opacity / height / length
  {at: [0.5, 1], fn: 's.equalWeight', label: 'A and B receive identical visual treatment (opacity, stroke, size, contrast)'},
  {at: [0.3, 0.6, 1], dom: `(() => { const a = svg.querySelector('[data-node="lens-bandA"]'), b = svg.querySelector('[data-node="lens-bandB"]');
    const hs = e => [...e.querySelectorAll('rect')].map(q => q.getAttribute('height'));
    return a.getAttribute('opacity') === b.getAttribute('opacity') && new Set([...hs(a), ...hs(b)]).size === 1; })()`, label: 'rendered lens bands: same opacity attribute and the same band height for A and B'},
  // one visual language for the split: connectors only, no duplicate unlabelled beams
  {at: [0.3, 0.6, 1], dom: `!svg.querySelector('[data-node^="beam"]')`, label: 'no unlabelled beam duplicates the labelled connectors'},
  // header units never broken ("Interpretation / A", "Proposed (as / supplied)")
  {at: [0, 1], fn: 's.headersWhole', label: 'card header units stay whole whenever a card line can hold them'},
  {at: [1], presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'], fn: 's.headLines.every(n => n === 1) && s.subParen.every(Boolean)', label: 'short supplied labels ("Interpretation A") are one line; "proposed (as supplied)" is one line or breaks only before its parenthesis'},
]);

suppliedTextSuite('LAW-0154', {
  fields: `const src = i => p.sources[Math.min(p.sources.length - 1, p.interpretations[i].source)].title;
    const kinds = [...new Set(p.relationships.map(r => r.kind))];
    return [p.passages.ref, p.passages.text, ...p.interpretations.flatMap(x => [x.label, x.text, x.focus]), src(0), src(1),
      p.sources[0].title, ...p.sources.map(s => s.id), ...p.hierarchy.levels, p.hierarchy.caption,
      ...p.elements.map(e => e.label), ...kinds.map(k => p.relationLabels[k])]`,
  captions: `return p.locale === 'es' ? ['Propuesta (según lo aportado)'] : ['Proposed (as supplied)']`,
});
