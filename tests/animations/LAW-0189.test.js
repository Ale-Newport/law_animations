// LAW-0189 — Atención en registro · story. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: continuous motion, props anchored to SOLVED hands (the bundle in the
// filer's then the clerk's hand, both hands on it at the hand-off; the slip rising from the printer,
// in the clerk's hand, both hands on it at the hand-back; the pen nib on each tapped slot), and an
// intake that reads with labels hidden.
// Timeline (LAW-0189.js W): walk 0.145–0.305 · raise 0.25–0.33 · clerk reaches 0.30–0.345 · both on
// the bundle 0.345–0.37 · take 0.37–0.41 · check rows 0.41–0.605 (3 rows: taps at 0.446–0.462,
// 0.511–0.527, 0.576–0.592) · lay 0.61–0.645 · key 0.665–0.68 · slip rises 0.672–0.705 · torn 0.705 ·
// both on the slip 0.75–0.765 · filer reads by 0.80 · state tag, key, relation, callout by 0.88.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {facesClear, labelsOwnConnectors, leadersClear, NO_TEXT_ON_BARS, dense} from './atencion-en-registro-dom.js';

const PENDING = {props: {items: [{label: 'Filing form', status: 'received'}, {label: 'Cover letter', status: 'pending'}, {label: 'Annex 1 · site plan', status: 'received'}], reference: 'REF-0427 (fictional)', speech: {filer: 'I would like to file these documents.', clerk: 'Here is your entry reference.'}}};

contractSuite('LAW-0189', {
  continuity: ['filerHand', 'clerkL', 'clerkR', 'pen', 'bundleC', 'slipC', 'filerHead', 'clerkHead'],
  attach: [
    // whoever holds the bundle or the slip has the hand on its grip (gripF/gripC are null otherwise)
    {from: 0, to: 1, a: 'filerHand', b: 'gripF', tol: 1.5},
    {from: 0, to: 1, a: 'clerkL', b: 'gripC', tol: 1.5},
    // hand-off of the bundle: the clerk's hand is on its right grip while the filer still holds it
    {from: 0, to: 1, a: 'clerkL', b: 'clerkOnBundle', tol: 1.5},
    // hand-back of the slip: the filer's hand is on its left grip while the clerk still holds it
    {from: 0, to: 1, a: 'filerHand', b: 'filerOnSlip', tol: 1.5},
    // while a slot is tapped the solved pen nib is on it (tapTarget is null otherwise)
    {from: 0, to: 1, a: 'pen', b: 'tapTarget', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "!s.walking && s.bundleHolder === 'filer' && s.dots.every(d => d === 0) && s.rings.every(d => d === 0) && s.slipRise === 0 && s.bubbleF === 0 && s.bubbleC === 0", label: 'rest: the bundle in the filer\'s hand, nothing checked, no slip, no bubble'},
    {at: 0.22, fn: "s.walking && s.bundleHolder === 'filer' && s.slipRise === 0", label: 'the person walks to the window carrying the bundle'},
    {at: 0.355, fn: "s.handoffB !== null && s.bundleHolder === 'filer' && s.bubbleF === 1 && s.speakingF", label: 'hand-off: both hands on the bundle while the filer says the supplied request'},
    {at: 0.4, fn: "s.bundleHolder === 'clerk' && s.dots.every(d => d === 0)", label: 'the clerk holds the bundle before anything is checked'},
    {at: 0.5, fn: "s.fanned.some(f => f > 0) && s.dots[0] === 1 && s.dots[2] === 0 && s.tapTarget === null", label: 'the check runs row by row: a sheet steps out, then its row is dotted'},
    {at: 0.62, fn: "s.received === 3 && s.pendingMarked === 0 && s.slipRise === 0", label: 'every supplied row checked before the slip is printed'},
    {at: 0.69, fn: "s.slipHolder === 'printer' && s.slipRise > 0 && s.slipRise < 1 && s.bundleHolder === 'ledge'", label: 'the slip rises out of the printer after the bundle is laid down'},
    {at: 0.73, fn: "s.slipHolder === 'clerk'", label: 'the clerk tears the slip off and carries it'},
    {at: 0.757, fn: "s.filerOnSlip !== null && s.slipHolder === 'clerk'", label: 'hand-back: both hands on the slip'},
    {at: 0.8, fn: "s.slipHolder === 'filer' && s.mainActionEnd <= 0.8", label: 'main action complete by u = 0.8'},
    {at: 1, fn: "s.received === 3 && s.pendingMarked === 0 && s.slipHolder === 'filer' && s.bubbleC === 1 && s.bundleHolder === 'ledge' && s.allReached && s.labelsFit && s.keyShown && s.finalState === 'reference-issued'", label: 'hold: all rows received as supplied, slip in the filer\'s hand, key shown'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.received === 3 && s.slipHolder === 'filer' && s.bundleHolder === 'ledge'", label: 'the intake reads identically with labels hidden'},
    {at: 1, params: PENDING, fn: "s.dots[1] === 0 && s.rings[1] === 1 && s.received === 2 && s.pendingMarked === 1 && s.fanned.length === 2 && s.slipHolder === 'filer'", label: 'a row supplied as pending: no sheet for it, a dashed ring, and the slip is still handed back as supplied'},
    {at: 0.5, params: PENDING, fn: 's.fanned.length === 2', label: 'the bundle holds only the received sheets'},
    {at: 1, params: {finalState: 'documents-checked'}, fn: "s.received === 3 && s.slipHolder === 'printer' && s.slipRise === 0 && s.bubbleC === 0", label: 'supplied state: documents checked, no slip printed'},
    {at: 1, params: {finalState: 'documents-handed-over'}, fn: "s.received === 0 && s.bundleHolder === 'clerk' && s.slipRise === 0", label: 'supplied state: documents handed over, nothing checked'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.bundleHolder === 'filer' && s.received === 0", label: 'actionProgress freezes the action part-way'},
  ],
});

suppliedTextSuite('LAW-0189', {
  fields: `const role = (id, i) => (p.actorLabels[id] || p.roles[id] || p.actors[i].role);
    return [p.actors[0].name, p.actors[1].name, role('filer', 0), role('clerk', 1), ...p.props.items.map(it => it.label), p.props.reference,
      p.props.speech.clerk, p.objectLabels.checklist, p.objectLabels.slip, p.relationships[0].label, ...p.annotations.map(a => a.text)]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Recibido', 'Pendiente (según lo aportado)'] : ['As supplied · no conclusion drawn', 'Received', 'Pending (as supplied)']`,
});

const FACE_SEL = '[data-node^="chip-"], [data-node="legend"], [data-node="key"], [data-node="state-tag"], [data-node$="-chip"], [data-node^="rell"], [data-node="st-card"], [data-node="bubF-mainpos"], [data-node="bubC-mainpos"], [data-node="st-slippos"], [data-node="st-bdpos"]';
ratioChecks('LAW-0189', 'layout fits; every IK target reached; faces, leaders, connectors and bars clear', [
  {at: [1], fn: 's.labelsFit && s.contentMin >= 16', label: 'labels fit without truncation or broken words', tv: ['all']},
  // the filer's request bubble opens with its supplied text (fitted whole, never cut) while the bundle is handed over
  {at: [0.36, 0.4], fn: 's.bubbleF === 1 && s.labelsFit', label: 'the request bubble is open with its text during the hand-off', tv: ['all']},
  {at: dense(0, 1, 0.02), fn: 's.allReached', label: 'every hand target is reached on every sampled frame'},
  // review repair: the walk reads in every ratio; the clerk never rises from the seat; 9:16 figures are large
  {at: [0.5], fn: 's.walkDistance >= 110', label: 'the filer starts a visible distance from the window (≥ 110 design px of walk)'},
  {at: dense(0, 1, 0.02), fn: 's.clerkRise === 0', label: 'the clerk never rises out of the chair (reach is solved by the arm)'},
  {at: [0.5], ratios: ['9:16'], presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'], fn: 'Math.min(s.headPx.filer, s.headPx.clerk) * 1080 / 950 >= 118', label: '9:16: both heads at least 118 px tall (depth framing, filer in the foreground)'},
  {at: [0.5], ratios: ['16:9'], presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'], fn: 'Math.min(s.headPx.filer, s.headPx.clerk) * 1920 / 1690 >= 105', label: '16:9: both heads at least 105 px tall'},
  {at: [0, 0.2, 0.3, 0.34, 0.36, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.72, 0.74, 0.76, 0.78, 0.8, 0.9, 1], dom: facesClear(['st-F-head', 'st-C-head'], FACE_SEL), label: 'rendered: no card, chip, bubble or held prop covers a face'},
  {at: [1], dom: labelsOwnConnectors('rell', 'rel'), label: 'rendered: the relation label sits beside its own connector (≤ 40 px)', tv: ['all']},
  {at: [1], dom: leadersClear('note', '[data-node^="chip-"], [data-node="legend"], [data-node="key"], [data-node="state-tag"], [data-node="st-F-head"], [data-node="st-C-head"]'), label: 'rendered: callout leaders are short and cross no text, chip or face', tv: ['all']},
  {at: dense(0, 1, 0.025), dom: NO_TEXT_ON_BARS, label: 'rendered: no visible text lands on a visible placeholder bar'},
]);
