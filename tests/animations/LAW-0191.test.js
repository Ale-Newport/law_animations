// LAW-0191 — Atención en registro · contrast. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: both scenes exist, exactly the indicated fact changes (the supplied status of
// ONE checklist item: B's bundle holds one sheet fewer, its row gets a dashed ring instead of a dot),
// and no legal consequence is invented (both clerks still print and hand back a slip; neutral note).
// Windows (LAW-0191.js W): hand-off 0.245–0.27 · fan 0.275–0.31 · check 0.31–0.53 (3 rows: taps at
// 0.35–0.369, 0.424–0.442, 0.497–0.516) · lay 0.535–0.57 · slip rises 0.597–0.63, torn 0.63 · both on the
// slip 0.675–0.69 · filer reads by 0.735 · rings 0.76–0.8 · guide 0.78–0.84 · note 0.82–0.87 · key by 0.87.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {facesClear, labelsOwnConnectors, NO_TEXT_ON_BARS, dense} from './atencion-en-registro-dom.js';

const CHANGE = 0.17;
const pts = ['filerHand', 'clerkL', 'pen', 'bundleC', 'slipC'];

contractSuite('LAW-0191', {
  continuity: [...pts.map(k => `${k}A`), ...pts.map(k => `${k}B`)],
  attach: ['A', 'B'].flatMap(s => [
    {from: 0, to: 1, a: `filerHand${s}`, b: `gripF${s}`, tol: 1.5},
    {from: 0, to: 1, a: `clerkL${s}`, b: `gripC${s}`, tol: 1.5},
    {from: 0, to: 1, a: `clerkL${s}`, b: `clerkOnBundle${s}`, tol: 1.5},
    {from: 0, to: 1, a: `filerHand${s}`, b: `filerOnSlip${s}`, tol: 1.5},
    {from: 0, to: 1, a: `pen${s}`, b: `tapTarget${s}`, tol: 1.5},
  ]),
  semantic: [
    {at: 0.05, fn: "JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.bundle === 'filer' && s.lookA.dots.every(d => d === 0)", label: 'base: two identical windows at rest'},
    {at: 0.16, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'no difference is shown before the change beat'},
    {at: 0.16, params: {props: {items: ['Filing form', 'Cover letter', 'Annex 1 · site plan'], changedItem: 0, reference: 'REF-0427 (fictional)'}}, fn: "JSON.stringify(s.lookA.sheetsShown) === JSON.stringify(s.lookB.sheetsShown) && s.lookA.sheetsShown.join() === 'cover' && s.lookA.sheetCountShown === s.lookB.sheetCountShown", label: 'changed first item: the squared bundles show the same neutral cover sheet (no colour or count differs before the change)'},
    {at: 0.32, fn: 's.lookA.sheetCountShown === 4 && s.lookB.sheetCountShown === 3', label: 'after the change the fans show the sheets: B one fewer'},
    {at: 0.26, fn: "s.a.bundleHolder === 'filer' && s.b.bundleHolder === 'filer' && s.clerkOnBundleA !== null && s.clerkOnBundleB !== null", label: 'the same hand-off at a shared point in both scenes'},
    {at: 0.32, fn: 's.lookA.fan.length === 3 && s.lookB.fan.length === 2 && s.lookA.fan.every(v => v === 1) && s.lookB.fan.every(v => v === 1)', label: 'change (inside the 0.17–0.40 beat): the fans open — B shows one sheet fewer'},
    {at: 0.4, fn: 's.lookA.dots[0] === 1 && s.lookB.dots[0] === 1 && s.lookA.dots[1] === 0 && s.lookB.dots[1] === 0', label: 'parallel: the rows are checked on one clock'},
    {at: 0.53, fn: 's.a.received === 3 && s.b.received === 2 && s.b.pendingMarked === 1 && s.a.pendingMarked === 0 && s.lookB.rings[2] === 1 && s.lookA.dots[2] === 1', label: 'exactly the indicated fact differs: dot in A, dashed ring in B on the changed row'},
    {at: 0.66, fn: "s.a.slipHolder === 'clerk' && s.b.slipHolder === 'clerk'", label: 'both clerks tear off a slip (no consequence drawn from the pending item)'},
    {at: 0.74, fn: "s.a.slipHolder === 'filer' && s.b.slipHolder === 'filer' && s.mainActionEnd <= 0.8", label: 'both slips handed back; main action complete by u = 0.8'},
    {at: 1, fn: "s.guideShown && s.noteShown && s.keyShown && s.rings === 1 && s.allReached && s.changedItem === 2 && s.a.received === 3 && s.b.received === 2 && s.labelsFit", label: 'guide on the one changed row, neutral note and key shown'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.received === 3 && s.b.received === 2 && s.b.pendingMarked === 1 && s.guideProgress === 1', label: 'the contrast plays identically with labels hidden'},
    {at: 1, params: {props: {items: ['Filing form', 'Cover letter', 'Annex 1 · site plan'], changedItem: 0, reference: 'REF-0427 (fictional)'}}, fn: 's.lookB.rings[0] === 1 && s.lookB.dots[0] === 0 && s.lookA.dots[0] === 1 && s.changedItem === 0', label: 'the changed row follows the SUPPLIED index'},
    {at: 1, fn: 's.laneColors.a !== s.laneColors.alarm && s.laneColors.b !== s.laneColors.alarm && s.laneColors.a !== s.laneColors.b', label: 'A/B badges in lane colours, not the alarm accent'},
  ],
});

identicalBeforeChange('LAW-0191', CHANGE);

suppliedTextSuite('LAW-0191', {
  fields: `const role = (id, i) => (p.roles[id] || p.actors[i].role);
    return [p.actors[0].name, p.actors[1].name, role('filer', 0), role('clerk', 1), ...p.props.items, p.props.reference, p.objectLabels.checklist, p.objectLabels.slip,
      p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.relationships[0].label]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Recibido', 'Pendiente (según lo aportado)'] : ['As supplied · no conclusion drawn', 'Received', 'Pending (as supplied)']`,
});

const HEADS = ['a-F-head', 'a-C-head', 'b-F-head', 'b-C-head'];
const CARDS = '[data-node^="pchip-"], [data-node="legend"], [data-node="key"], [data-node="note"], [data-node="list"], [data-node="facts"], [data-node="guide-labg"], [data-node^="hdr"], [data-node="rell0"], [data-node="a-card"], [data-node="b-card"], [data-node="a-slippos"], [data-node="b-slippos"], [data-node="a-bdpos"], [data-node="b-bdpos"], [data-node="pb0-body"], [data-node="pb1-body"]';
// the guide label sits beside its own guide line (≤ 40 px at 1080p)
const GUIDE_LABEL = `(() => {
  const vb = svg.viewBox.baseVal, px = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const lab = svg.querySelector('[data-node="guide-labg"]'), path = svg.querySelector('[data-node="guide"]');
  if (!lab || !path) return false;
  const b = lab.getBoundingClientRect(), m = path.getScreenCTM(), L = path.getTotalLength();
  let d = Infinity;
  for (let j = 0; j <= 200; j++) { const q = path.getPointAtLength((L * j) / 200).matrixTransform(m); d = Math.min(d, Math.hypot(Math.max(b.left - q.x, 0, q.x - b.right), Math.max(b.top - q.y, 0, q.y - b.bottom))); }
  return d / px <= 40;
})()`;
ratioChecks('LAW-0191', 'layout fits; scenes stay large; faces, connectors and bars clear; hands reach', [
  {at: [1], fn: "s.labelsFit && (s.arrangement === 'row' ? s.sceneFrac >= 0.4 : s.arrangement === 'stackL' ? s.sceneHFrac >= 0.4 : s.sceneFrac >= 0.8)", label: 'labels fit; each scene ≥ 40 % of the width side by side, ≥ 40 % of the height stacked beside the strip (1:1), ≥ 80 % of the width stacked full width'},
  {at: [1], ratios: ['1:1'], fn: "s.arrangement === 'stackL'", label: '1:1: scenes stacked in the left column, the shared strip in the right-hand column'},
  {at: [1], ratios: ['16:9'], tv: ['none'], fn: 's.vFill >= 0.7', label: 'labels hidden: the scenes grow to fill the frame (≥ 70 % of the height)'},
  {at: [1], presets: ['baseline-illustrative', 'baseline-es'], tv: ['all'], fn: 's.textSize >= 19.5', label: 'baseline presets (incl. es): text ≥ 19.5 px in every ratio'},
  {at: dense(0, 1, 0.02), fn: 's.allReached', label: 'every hand target is reached on every sampled frame'},
  {at: [0, 0.2, 0.26, 0.3, 0.35, 0.45, 0.55, 0.62, 0.66, 0.7, 0.74, 0.8, 0.9, 1], dom: facesClear(HEADS, CARDS), label: 'rendered: no card, chip, bubble or held prop covers a face'},
  {at: [1], dom: labelsOwnConnectors('rell', 'rel'), label: 'rendered: the relation label sits beside its own connector', tv: ['all']},
  {at: [1], dom: GUIDE_LABEL, label: 'rendered: the guide label sits beside the guide line', tv: ['all']},
  {at: dense(0, 1, 0.025), dom: NO_TEXT_ON_BARS, label: 'rendered: no visible text lands on a visible placeholder bar'},
]);
