// LAW-0234 — Archivo judicial · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its component (edge to edge, following the components while they
// move or enlarge), the order does not change when seeking, and a relation is never drawn as causality by default
// (plain lines, no arrowheads; a causal mark only when supplied).
// Timing (u): the room comes apart 0.02–0.14, name chips 0.12–0.17 · relationships drawn one after another 0.19–0.42 ·
// tracer 0.44–0.73 (the console lamp, then the lamp and aisle of the block that holds the identifier; the focus
// element enlarged while the tracer is on it, back by 0.785) · state 0.78–0.83.
// Coordinator decision (standing rule 2026-09-26, AUTHORING item 20, from LAW-0687/0689–0692): the long-labels-stress
// preset is capped — three component labels (34–36 characters) and six relationships (labels 28–33 characters) instead of
// seven labels (42–49) and 7–8 relationships (45–50). With the near-maximum values the rendered text stays >= 16 px in
// every ratio; the true drivers (independent review courts-09, 2026-09-27) are: relationship labels get ellipsised (one
// at 9:16, two at 1:1 — AUTHORING item 2), the clerk drops to 59.6 px at 1:1 with all seven component labels (floor
// 60 px), and the chips cannot be placed with eight relationships. Fallbacks and measurements are in the presets note.
// Every other stress field stays at near-maximum length, every field stays longer than the baseline and every count
// >= the baseline. Every check below applies to it unchanged.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, equalWeightTest, neutralityTest,
  noArrowsTest, seekHistoryTest, blankWindowTest,
} from './archivo-judicial-checks.js';

const ID = 'LAW-0234';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.explode === 0 && s.relationsDrawn.every(v => v === 0)", label: 'start: the room assembled, no relationship drawn'},
    {at: 0.18, fn: 's.explode === 1 && s.relationsDrawn.every(v => v === 0)', label: 'separate: the components apart by u 0.18; relationships not yet drawn'},
    {at: 0.3, fn: 's.relationsDrawn[0] === 1 && s.relationsDrawn[s.relationsDrawn.length - 1] === 0', label: 'relate: the relationships are drawn one after another'},
    {at: 0.43, fn: 's.relationsDrawn.every(v => v === 1) && !s.tracerVisible', label: 'every supplied relationship is drawn before the tracer starts'},
    {at: 0.6, fn: "s.tracerVisible && s.focusScale > 1.15 && s.lamp === 1 && s.consoleLamp === 1", label: 'trace: the tracer runs; the console and the block lamp are lit; the focus element is enlarged'},
    {at: 0.8, fn: 's.focusScale === 1 && s.open === 1 && s.lamp === 1', label: 'gather: the focus back at size; the lamp lit and the aisle open stay visible'},
    {at: 1, fn: "s.arrowheads === 0 && !s.relationKinds.includes('causal') && s.problems.length === 0", label: 'no causal link by default; the composition fits'},
    {at: 0.3, fn: 's.lamp === 0 && s.open === 0 && s.consoleLamp === 0', label: 'seeking back restores the earlier state'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.block === 'archived' && s.focus === 'archivedShelves' && s.open === 1", label: 'supplied as archived: the ◆ block lights and opens'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 's.tracerVisible && s.focusScale > 1.15', label: 'labels hidden: the same mechanism runs'},
    {at: 1, params: {relationships: [{from: 'locator', to: 'activeShelves', kind: 'causal', label: 'supplied causal link'}, {from: 'identifier', to: 'locator', kind: 'relation'}], traversalOrder: ['identifier', 'locator', 'activeShelves']}, fn: "s.arrowheads === 1 && s.relationKinds.includes('causal')", label: 'a causal link appears only when the author supplies it'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const lab = id => ((p.elements || []).find(e => e.id === id) || {}).label; return [p.courts.building, p.courts.archive, p.courts.active, p.courts.archived, p.routes.rails, p.routes.locator, p.seats.counter, p.seats.clerk.name, p.labels.sequence, p.labels.key, p.file.identifier, ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label).filter(Boolean), p.relationLabels.relation, p.relationLabels.communication];",
  content: 'return [p.file.identifier, ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label).filter(Boolean)];',
  captions: 'return [p.routes.rails, p.routes.locator, p.relationLabels.relation, p.relationLabels.communication];',
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden).
// connector segment of relationship i in screen px (its path is "M x y L x y" in plan units)
const SEG = "const seg = i => { const e = svg.querySelector('[data-node=\"rel' + i + '-line\"]'); if (!e) return null; const m = e.getScreenCTM(); const n = (e.getAttribute('d') || '').match(/-?[\\d.]+/g).map(Number); return [new DOMPoint(n[0], n[1]).matrixTransform(m), new DOMPoint(n[2], n[3]).matrixTransform(m)]; }; const px = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width * Math.min(svg.viewBox.baseVal.width, svg.viewBox.baseVal.height) / 1080; const dist = (b, s) => { let m = Infinity; for (let j = 0; j <= 60; j++) { const x = s[0].x + (s[1].x - s[0].x) * j / 60, y = s[0].y + (s[1].y - s[0].y) * j / 60; m = Math.min(m, Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom))); } return m / px; };";
// every relation label lies <= 24 px (1080p) from its own connector and nearer it than any other connector
const LABELS_NEAR = `(() => { ${SEG}
  const n = svg.querySelectorAll('[data-node$="-line"][data-node^="rel"]').length;
  for (let i = 0; i < n; i++) {
    const t = svg.querySelector('[data-node="rlab' + i + '-text"]'); if (!t) continue;
    const card = t.previousElementSibling || t; const b = card.getBoundingClientRect();
    const own = dist(b, seg(i));
    if (own > 24) return false;
    for (let j = 0; j < n; j++) if (j !== i && dist(b, seg(j)) <= own) return false;
  }
  return true;
})()`;
// every connector ends on (within 3 px of) the two components it joins
const ENDS_ON = `(() => {
  const lines = [...svg.querySelectorAll('[data-node$="-line"][data-node^="rel"]')];
  if (!lines.length) return false;
  for (const e of lines) {
    const m = e.getScreenCTM(); const n = (e.getAttribute('d') || '').match(/-?[\\d.]+/g).map(Number);
    const a = new DOMPoint(n[0], n[1]).matrixTransform(m), b = new DOMPoint(n[2], n[3]).matrixTransform(m);
    const near = (q, id) => { const r0 = svg.querySelector('[data-node="cmp-' + id + '"]').getBoundingClientRect(); return q.x >= r0.left - 6 && q.x <= r0.right + 6 && q.y >= r0.top - 6 && q.y <= r0.bottom + 6; };
    if (!near(a, e.getAttribute('data-from')) || !near(b, e.getAttribute('data-to'))) return false;
  }
  return true;
})()`;
// no name chip or relation label card lies over a component (prop) at any time once shown
const CARDS_OFF_PROPS = `(() => {
  const vis = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined && parseFloat(a) < 0.3) return false; } return true; };
  const cards = [...svg.querySelectorAll('[data-node$="-card-body"]'), ...[...svg.querySelectorAll('[data-node$="-text"][data-node^="rlab"]')].map(t => t.previousElementSibling)].filter(e => e && vis(e)).map(e => e.getBoundingClientRect());
  // (the clerk counts by its visible parts: its rig also holds hidden seated legs, which a group box would include)
  const props = [...svg.querySelectorAll('[data-node^="m-u"], [data-node^="m-plaque"], [data-node^="tint"], [data-node="console"], [data-node="m-slip"], [data-node="m-file"], [data-node="m-desk"]')].map(e => e.getBoundingClientRect());
  const cp = [...svg.querySelectorAll('[data-node="m-clerk-head"], [data-node^="m-clerk-arm"], [data-node^="m-clerk-foot"]')].map(e => e.getBoundingClientRect());
  props.push({left: Math.min(...cp.map(q => q.left)), right: Math.max(...cp.map(q => q.right)), top: Math.min(...cp.map(q => q.top)), bottom: Math.max(...cp.map(q => q.bottom))});
  return cards.every(c => props.every(q => !(c.left < q.right - 1 && q.left < c.right - 1 && c.top < q.bottom - 1 && q.top < c.bottom - 1)));
})()`;
// the scene fills the caption-safe box at the hold: >= 80 % on one axis (the harness's low-frame-coverage line) and
// >= 60 % on the other; the exploded plan keeps room for the focus element's enlargement, which is over by the hold
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.8 && Math.min(fh, fw) >= 0.6; })()";

ratioChecks(ID, 'connectors land on their components, labels beside their own line, the scene fills the frame', [
  {at: [0.45, 0.6, 0.7, 1], tv: ['all'], dom: LABELS_NEAR, label: 'rendered: each relation label is <= 24 px from its own connector and nearer it than any other'},
  {at: [0.45, 0.6, 0.65, 0.7, 0.9, 1], dom: ENDS_ON, label: 'rendered: every connector ends on the two components it joins (also while the focus is enlarged)'},
  {at: times(0.17, 1, 0.02), dom: CARDS_OFF_PROPS, label: 'rendered: no name chip or relation label lies over a component, also while the focus is enlarged'},
  {at: [1], dom: FILL, label: 'rendered: the scene fills the caption-safe box'},
  {at: times(0.45, 0.72, 0.01), fn: 's.tracerVisible', label: 'the tracer runs through the whole trace beat'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node^="chip-"]', '[data-node="tracer"]', '[data-node^="cmp-"]']});
peopleSizeTest(ID, {names: ['m-clerk'], min: 60, step: 0.02});
equalWeightTest(ID, {chips: [['[data-node="chip-activeShelves-card"]', '[data-node="chip-archivedShelves-card"]']], marks: [['[data-node="m-mark0"]', '[data-node="m-mark1"]'], ['[data-node="m-tmark0"]', '[data-node="m-tmark1"]']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
// (the plan group's box is the extent of the room and of every component in it: the exploded plan fills it)
blankWindowTest(ID, {selectors: ['[data-node="plan"]', '[data-node="panel"]', '[data-node^="chip-"]', '[data-node="state"]']});
coldCreateTest(ID);
