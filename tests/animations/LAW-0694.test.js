// LAW-0694 — Evento interviniente · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking (the tracer's
// visits follow the supplied traversal order at every sampled time, in any seek order) and a relation is never drawn
// as causation by default (sequence links unless a link is supplied as causal; alternatives tied by plain relations).
// Windows (LAW-0694.js W): pieces appear 0–0.05 · gap opens 0.04–0.11 · later event slides down 0.08–0.17 · relations
// drawn one by one 0.19–0.42 · kinds strip 0.20–0.26 · tracer 0.44–0.74 (out 0.74–0.77) · key 0.78–0.84.
// coordinator decision 2026-09-26 (standing stress cap rule, LAW-0687/0689–0692 precedent; see SESSION_HANDOFF): the
// long-labels-stress lengths are capped to the longest tried values that fit every ratio at >= 16 px (measurements in
// LAW-0694.presets.json); every field stays longer than the baseline and every count >= the baseline.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME} from './evento-interviniente-checks.js';

const ID = 'LAW-0694';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['added', 'tracer'],
  semantic: [
    {at: 0, fn: '!s.entered && s.gapOpen === 0', label: 'separate: the initial sequence stands closed up; the later event waits on its lift'},
    {at: 0.18, fn: 's.entered && s.gapOpen === 1', label: 'the gap is open and the later event stands in it (slid down its lift, no teleport)'},
    {at: 0.3, fn: "s.drawn.every(k => k === 'sequence') && s.arrows.every(Boolean)", label: 'default: every link is a sequence arrow — no causal link unless supplied'},
    {at: 0.6, fn: "s.tracerOn && s.visited[0] === 'e1' && s.visited.every((v, i) => v === s.order[i])", label: 'trace: the tracer visits the elements in the supplied order'},
    {at: 0.76, fn: 's.visited.length === s.order.length', label: 'the tracer completes the supplied traversal order'},
    {at: 1, fn: '!s.tracerOn && s.focusScale > 1', label: 'gather: tracer gone; the focus element stays marked (enlarged)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.drawn.includes('causal') && s.drawn.includes('disputed') && s.arrows[s.drawn.indexOf('disputed')] === false && s.altTies === 1", label: 'alternative: causal only where supplied; the disputed link has no arrowhead; the alternative is tied by a plain relation'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: 's.entered && s.tracerOn', label: 'labels hidden: the same entry and trace'},
  ],
});

ratioChecks(ID, 'layout fits; connectors land; the traversal order is kept at every time', [
  {at: [1], fn: 's.layout.k >= 0.97 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
  {at: [1], fn: 's.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
  {at: [0, 1], fn: 's.extrasClear && s.altsClear', label: 'extra supplied arcs and alternative icons stay clear of the later event’s lift / dock (item 16)'},
  {at: times(0.44, 1, 0.04), fn: 's.visited.every((v, i) => v === s.order[i])', label: 'the tracer’s visits are always a prefix of the supplied order'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text', [
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
]);

suppliedTextSuite(ID, {
  fields: "const over = id => (p.elements || []).find(e => e.id === id); const kinds = [...new Set([...p.causalLinks.map(l => l.status === 'disputed' ? 'disputed' : l.kind === 'causal' ? 'causal' : 'sequence'), 'sequence', ...(p.alternatives.length ? ['relation'] : []), ...p.relationships.map(r => r.kind)])]; return [...p.events.map((e, i) => over('e' + (i + 1)) ? null : e.label), ...p.events.map((e, i) => over('e' + (i + 1)) ? null : e.time), over('x') ? null : p.addedEvent.label, over('x') ? null : p.addedEvent.time, ...p.losses.map(l => over('loss') ? null : l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label), ...kinds.map(k => p.relationLabels[k])]",
  content: "const over = id => (p.elements || []).find(e => e.id === id); return [...p.events.map(e => e.label), p.addedEvent.label, ...p.losses.map(l => over('loss') ? null : l.label), ...p.alternatives.map(a => a.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

ratioChecks(ID, 'baseline and baseline-es text >= 19.5 px', [
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.layout.size * s.layout.k >= 19.5', label: 'text size >= 19.5 px (layout size × block scale)'},
]);

textSizeOverTime(ID);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Later|Link|Loss|sequence|relation|causal|disputed|supplied|event|conclusion)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);
