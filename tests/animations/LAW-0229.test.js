// LAW-0229 — Deliberación separada · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (the public space, its seated participants and their badges
// never jump), anchoring of the objects (people, badges and the name chip travel with the public space), and the
// transformation (the public space moves apart from the abstract zone) recognisable with the labels hidden.
// Legal content: the zone is abstract and empty; nothing states who may attend, a secrecy rule, a vote, a decision
// or any outcome; ● audiencia and ◆ deliberación get equal visual weight (solid cues, no dashes); no arrows.
// Timing (u): rest 0–0.15 · the partition door closes 0.15–0.22 (the cause) · the track draws on 0.19–0.27 · the
// public space moves 0.23–0.69 · notes 0.75–0.80 · state 0.76–0.81; everything is still from u 0.81.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, equalWeightTest, wordingTest, noArrowsTest, fillMostTest, thinContentTest} from './deliberacion-separada-checks.js';

const ID = 'LAW-0229';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['pub', 'p0', 'p1', 'p2', 'badge0', 'chipLead'],
  attach: [
    {from: 0, to: 1, a: 'badge0', b: 'badge0Seat', tol: 0.5},
    {from: 0, to: 1, a: 'badge2', b: 'badge2Seat', tol: 0.5},
    {from: 0, to: 1, a: 'chipLead', b: 'chipLeadTarget', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.doorOpen === 1 && s.move === 0 && s.rails === 0 && s.adjacent", label: 'rest: the two spaces side by side, the partition door open, nothing drawn yet'},
    {at: 0.145, fn: 's.doorOpen === 1 && s.move === 0', label: 'nothing moves during the rest beat'},
    {at: 0.2, fn: 's.doorOpen > 0 && s.doorOpen < 1 && s.move === 0', label: 'the door closes first (the cause) while the public space is still in place'},
    {at: 0.35, fn: 's.doorOpen === 0 && s.move > 0 && !s.separated && s.rails === 1', label: 'then the public space moves along the drawn track'},
    {at: 0.74, fn: 's.separated && s.doorOpen === 0', label: 'the displacement is complete by u 0.74: a separation lies between the spaces'},
    {at: 1, fn: "s.separated && s.finalState === 'apart' && s.allReached && s.problems.length === 0", label: 'hold: the supplied final state; the composition fits'},
    {at: 0.1, fn: 's.move === 0 && s.doorOpen === 1', label: 'seeking back restores the rest state exactly'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.separated && s.doorOpen === 0', label: 'labels hidden: the same moving apart happens'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.adjacent && s.doorOpen === 0 && s.finalState === 'adjacent' && s.rails === 0", label: 'supplied final state "adjacent": the door closes and the public space stays beside the zone'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && !s.separated', label: 'actionProgress freezes the moving apart part-way'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.hearing, p.courts.deliberation, p.routes.partition, ...(p.finalState === 'apart' ? [p.routes.track, p.labels.gap] : []), p.seats.bench, ...p.seats.participants.map(q => q.name), ...(p.finalState === 'apart' ? [p.labels.sequence] : []), p.labels.key, p.actorLabels.participants, p.objectLabels.hearing, p.objectLabels.deliberation, ...p.annotations.map(a => a.text)];",
  content: 'return [p.courts.building, p.courts.hearing, p.courts.deliberation, ...p.seats.participants.map(q => q.name)];',
  captions: "return [p.routes.partition, p.seats.bench, p.actorLabels.participants, p.objectLabels.hearing, p.objectLabels.deliberation];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden).
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
// no chip, badge or panel row covers a participant's head
const NO_COVER = `(() => { ${BOX}
  const heads = [...svg.querySelectorAll('[data-node$="-head"]')].filter(e => /^p\\d-head$/.test(e.getAttribute('data-node'))).map(bx);
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(hearing-chip|zone-chip|building-chip|badge\\d|panel|state)$/.test(e.getAttribute('data-node')) && visible(e)).flatMap(e => e.getAttribute('data-node') === 'panel' ? [...e.children] : [e]).map(bx);
  return heads.every(hd => cards.every(c => !hit(c, hd, 1)));
})()`;
// the separation is visible at the hold when apart: the public space's walls no longer touch the zone's
const GAP_VISIBLE = "(() => { const a = svg.querySelector('[data-node=\"s-pwall\"]').getBoundingClientRect(), z = svg.querySelector('[data-node=\"s-zwall\"]').getBoundingClientRect(); const gx = Math.max(z.left - a.right, a.left - z.right), gy = Math.max(z.top - a.bottom, a.top - z.bottom); return Math.max(gx, gy) > 40 * svg.getBoundingClientRect().width / 1920; })()";
// people and furniture stay inside the public space's walls
const PEOPLE_INSIDE = `(() => { ${BOX}
  const room = bx(svg.querySelector('[data-node="s-pwall"]'));
  return [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d$/.test(e.getAttribute('data-node'))).every(e => { const b = bx(e.querySelector('[data-node$="-head"]')); return b.l > room.l && b.r < room.r && b.t > room.t && b.b < room.b; });
})()`;
// nothing is drawn inside the abstract zone except its tint, texture, outline and ◆ (no person, no furniture)
const ZONE_EMPTY = `(() => { ${BOX}
  const z = bx(svg.querySelector('[data-node="s-zone"]').querySelector('rect'));
  return [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d$/.test(e.getAttribute('data-node')) || /bench/.test(e.getAttribute('data-node'))).every(e => !hit(bx(e), z, 2));
})()`;

ratioChecks(ID, 'people uncovered and inside their space, the zone empty, the separation visible', [
  {at: times(0, 1, 0.05), dom: NO_COVER, label: 'rendered: no chip, badge or panel row covers a participant\'s head'},
  {at: times(0, 1, 0.1), dom: PEOPLE_INSIDE, label: 'rendered: the participants stay inside the public space while it moves'},
  {at: times(0, 1, 0.1), dom: ZONE_EMPTY, label: 'rendered: nobody and no furniture enters the abstract zone'},
  {at: [1], presets: ['baseline-illustrative', 'long-labels-stress', 'baseline-es'], dom: GAP_VISIBLE, label: 'rendered: a visible separation lies between the two spaces at the hold'},
  {at: times(0, 1, 0.01), fn: 's.doorClosedBeforeMove', label: 'the partition door is closed before the public space moves (cause before effect)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node^="badge"]', '[data-node="hearing-chip"]', '[data-node="zone-chip"]', '[data-node="building-chip"]', '[data-node="s-pmark"]', '[data-node="s-zmark"]']});
peopleSizeTest(ID, {names: ['p0', 'p1', 'p2', 'p3'], min: 60, step: 0.05});
equalWeightTest(ID, {chips: [['[data-node="hearing-name"]', '[data-node="zone-name"]']], marks: ['[data-node="s-pmark"]', '[data-node="s-zmark"]']});
wordingTest(ID);
noArrowsTest(ID);
coldCreateTest(ID);
// item 11 at rest, build and hold (labels shown and hidden), and no thin-content stretch > 200 ms (item 19)
fillMostTest(ID, {at: [0.05, 0.3, 0.55, 1]});
thinContentTest(ID);
