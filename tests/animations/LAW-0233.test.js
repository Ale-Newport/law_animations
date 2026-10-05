// LAW-0233 — Archivo judicial · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (the clerk, the file and the units never jump), anchoring of the
// objects (the file follows the clerk's solved hands from the shelf to the tray; the identifier chip stays led to the
// slip), and the transformation (the shelves locate the file: lamp, units roll, aisle open, file fetched)
// recognisable with the labels hidden.
// Legal content: "archived" is only another shelf block in this example; nothing states a retention period, access or
// destruction rule, archiving procedure, time span or outcome; ● active and ◆ archived get equal weight (mirrored
// blocks, same plaques and trays, solid cues, no dashes, no red); no arrows.
// Timing (u): rest 0–0.15 · pulse 0.15–0.20 · lamp 0.195–0.225 · units roll 0.215–0.36 · the clerk walks out
// 0.25–0.46 · reach 0.46–0.49 · pull 0.49–0.52 · walks back 0.53–0.69 · lets go in the tray 0.70–0.725 · notes
// 0.75–0.80 · state 0.76–0.81; everything is still from u 0.81.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, equalWeightTest, neutralityTest,
  noArrowsTest, seekHistoryTest, blankWindowTest,
} from './archivo-judicial-checks.js';

const ID = 'LAW-0233';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['clerk', 'file', 'hands'],
  attach: [
    {from: 0.52, to: 0.69, a: 'file', b: 'hands', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.lamp === 0 && s.open === 0 && s.holder === 'shelf' && s.carry === 1", label: 'rest: every unit packed, the lamp off, the clerk\'s hands on the slip, the file on its shelf'},
    {at: 0.145, fn: 's.pulse === 0 && s.open === 0', label: 'nothing moves during the rest beat'},
    {at: 0.19, fn: 's.pulse > 0 && s.lamp === 0 && s.open === 0', label: 'the pulse runs along the locator link first (the cause)'},
    {at: 0.3, fn: 's.lamp === 1 && s.open > 0 && s.open < 1 && !s.inAisle', label: 'then the lamp is lit and the units roll; the clerk is not yet in the aisle'},
    {at: 0.5, fn: "s.open === 1 && s.inAisle && s.holder === 'clerk'", label: 'the clerk takes the file from the open aisle'},
    {at: 0.74, fn: "s.holder === 'tray' && s.carry === 0", label: 'the file is set in its tray by u 0.74'},
    {at: 1, fn: "s.holder === 'tray' && s.block === 'active' && s.finalState === 'atCounter' && s.problems.length === 0", label: 'hold: the supplied final state; the composition fits'},
    {at: 0.1, fn: "s.open === 0 && s.lamp === 0 && s.holder === 'shelf'", label: 'seeking back restores the rest state exactly'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.holder === 'tray' && s.open === 1", label: 'labels hidden: the same locating happens'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.block === 'archived' && s.holder === 'shelf' && s.inAisle && s.finalState === 'located'", label: 'supplied as archived and "located": the ◆ block opens and the file stays on its shelf'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.holder !== 'tray'", label: 'actionProgress freezes the locating part-way'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.archive, p.courts.active, p.courts.archived, p.routes.rails, p.routes.locator, p.seats.counter, p.seats.clerk.name, p.labels.sequence, p.labels.key, p.file.identifier, p.actorLabels.clerk, p.objectLabels.active, p.objectLabels.archived, p.objectLabels.file, ...p.annotations.map(a => a.text)];",
  content: 'return [p.courts.active, p.courts.archived, p.seats.clerk.name, p.file.identifier];',
  captions: 'return [p.routes.rails, p.routes.locator, p.seats.counter, p.objectLabels.active, p.objectLabels.archived];',
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden).
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
// no chip or panel row covers the clerk's head
const NO_COVER = `(() => { ${BOX}
  const hd = svg.querySelector('[data-node="clerk-head"]'); if (!hd) return false; const H = bx(hd);
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(sec-chip\\d|id-chip|panel|state)$/.test(e.getAttribute('data-node')) && visible(e)).flatMap(e => e.getAttribute('data-node') === 'panel' ? [...e.children] : [e]).map(bx);
  return cards.every(c => !hit(c, H, 1));
})()`;
// the file stays between the clerk's two hands while carried (rendered)
const FILE_IN_HANDS = `(() => { ${BOX}
  const f = bx(svg.querySelector('[data-node="file"]'));
  const hs = ['clerk-armL-h', 'clerk-armR-h'].map(n => bx(svg.querySelector('[data-node="' + n + '"]')));
  const c = hs.map(q => ({x: (q.l + q.r) / 2, y: (q.t + q.b) / 2}));
  const pad = (f.r - f.l) * 0.25 + 4;
  return c.every(q => q.x >= f.l - pad && q.x <= f.r + pad && q.y >= f.t - pad && q.y <= f.b + pad);
})()`;
// the clerk stays inside the room walls and outside the packed units (the aisle is open before the clerk enters)
const CLERK_CLEAR = `(() => { ${BOX}
  const hd = bx(svg.querySelector('[data-node="clerk-head"]'));
  const room = bx(svg.querySelector('[data-node="s-floor"]'));
  if (!(hd.l > room.l && hd.r < room.r && hd.t > room.t && hd.b < room.b)) return false;
  const units = [...svg.querySelectorAll('[data-node]')].filter(e => /^s-u\\d\\d$/.test(e.getAttribute('data-node'))).map(bx);
  return units.every(q => !hit(q, hd, 2));
})()`;
// the scene fills the caption-safe box: >= 90 % on its long axis and >= 72 % on the other with labels shown
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); const labels = !!svg.querySelector('[data-node=\"panel\"]'); return Math.max(fh, fw) >= 0.9 && (!labels || Math.min(fh, fw) >= 0.72); })()";
// the plan covers >= 20 % of the caption-safe box area with labels shown and >= 45 % with labels hidden
const PLAN_SHARE = "(() => { const m = svg.getScreenCTM().inverse(); const q = svg.querySelector('[data-node=\"s-room\"]').getBoundingClientRect(); const p1 = new DOMPoint(q.left, q.top).matrixTransform(m), p2 = new DOMPoint(q.right, q.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const share = ((p2.x - p1.x) * (p2.y - p1.y)) / (vb.width * 0.88 * vb.height * 0.74); return share >= (svg.querySelector('[data-node=\"panel\"]') ? 0.2 : 0.45); })()";

ratioChecks(ID, 'the clerk uncovered and clear of the units, the file in the hands, the plan fills the frame', [
  {at: times(0, 1, 0.02), dom: NO_COVER, label: 'rendered: no chip or panel row covers the clerk\'s head'},
  {at: times(0.53, 0.69, 0.02), presets: ['baseline-illustrative', 'long-labels-stress', 'baseline-es'], dom: FILE_IN_HANDS, label: 'rendered: the carried file stays between the clerk\'s hands'},
  {at: times(0, 1, 0.01), dom: CLERK_CLEAR, label: 'rendered: the clerk stays in the room and never walks through a unit'},
  {at: [1], dom: FILL, label: 'rendered: the scene fills the caption-safe box (labels shown and hidden)'},
  {at: [0, 0.5, 1], dom: PLAN_SHARE, label: 'rendered: the plan takes a large share of the frame'},
  {at: times(0, 1, 0.01), fn: 's.lampBeforeRoll && s.aisleOpenWhenEntering', label: 'the lamp is lit before any unit rolls, and the aisle is open before the clerk enters it'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node="sec-chip0"]', '[data-node="sec-chip1"]', '[data-node="id-chip"]', '[data-node="s-plaque0"]', '[data-node="s-plaque1"]', '[data-node="clerk"]', '[data-node="file"]', '[data-node="s-pulse"]']});
peopleSizeTest(ID, {names: ['clerk'], min: 60, step: 0.02});
equalWeightTest(ID, {chips: [['[data-node="sec-chip0"]', '[data-node="sec-chip1"]'], ['[data-node="legend-active"]', '[data-node="legend-archived"]']], marks: [['[data-node="s-mark0"]', '[data-node="s-mark1"]'], ['[data-node="s-tmark0"]', '[data-node="s-tmark1"]']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
blankWindowTest(ID, {selectors: ['[data-node="s-room"]', '[data-node="panel"]', '[data-node="sec-chip0"]', '[data-node="sec-chip1"]', '[data-node="id-chip"]', '[data-node="state"]']});
coldCreateTest(ID);
