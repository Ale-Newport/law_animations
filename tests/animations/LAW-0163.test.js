// LAW-0163 — Entrevista a cliente · contrast. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: both scenes exist, exactly the indicated fact
// (the detail of the answer) is modified — and it changes geometry (the strip mark) —
// and no legal consequence is added to complete the contrast.
// Windows (LAW-0163.js W): question 0.17–0.27, answer 0.27–0.38, row mark 0.45–0.50,
// strip mark 0.55–0.70, pen back 0.70–0.76, rings 0.77–0.81, guide 0.79–0.85, note by 0.90.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

contractSuite('LAW-0163', {
  continuity: ['penA', 'penB', 'handAA', 'handAB', 'handBA', 'handBB', 'gripBA', 'gripBB'],
  continuityLimit: 45,
  attach: [
    // each question board stays in its interviewer's far hand
    {from: 0, to: 1, a: 'gripBA', b: 'boardGripA', tol: 1.5},
    {from: 0, to: 1, a: 'gripBB', b: 'boardGripB', tol: 1.5},
    // while marking (row tick, strip mark) each solved pen nib is on its mark's path
    {from: 0, to: 1, a: 'penA', b: 'tickA', tol: 1.5},
    {from: 0, to: 1, a: 'penB', b: 'tickB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.bubble === 0 && s.b.bubble === 0 && s.a.markDrawn === 0', label: 'base: two identical scenes at rest'},
    {at: 0.21, fn: 's.lookA.ask > 0.9 && s.lookB.ask > 0.9 && s.a.bubble === 0 && s.b.bubble === 0', label: 'the same question is asked in both scenes before any answer'},
    {at: 0.36, fn: 's.a.bubble === 1 && s.b.bubble === 1 && s.b.markerShown > 0 && s.a.markerShown === 0 && s.a.markDrawn === 0', label: 'change: the answers differ; only B carries the clarified-datum marker; nothing marked yet'},
    {at: 0.47, fn: 's.a.ticked > 0 && s.a.ticked === s.b.ticked && s.a.markDrawn === 0', label: 'parallel: both pens mark the asked question at the same time'},
    {at: 0.62, fn: 's.a.markDrawn > 0 && s.a.markDrawn === s.b.markDrawn && s.lookA.markLen > s.lookB.markLen * 1.5', label: 'same timing, different geometry: A loops a span of days, B rings one day'},
    {at: 1, fn: 's.a.markDrawn === 1 && s.b.markDrawn === 1 && s.a.span.from === 1 && s.a.span.to === 7 && s.b.span.from === 3 && s.b.span.to === 3 && s.guideProgress === 1 && s.ringsShown === 1 && s.notesShown === 1 && s.allReached && s.changedFact === "detail"', label: 'hold: both marks complete, guide and neutral note shown'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.markDrawn === 1 && s.b.markDrawn === 1 && s.lookA.markLen > s.lookB.markLen * 1.5 && s.guideProgress === 1', label: 'the contrast plays identically with labels hidden'},
    {at: 1, params: {detailSpans: {a: {from: 2, to: 2}, b: {from: 2, to: 2}}}, fn: 's.lookA.markLen === s.lookB.markLen', label: 'geometry follows the SUPPLIED spans, not the wording: equal spans give equal marks'},
    {at: 0.21, params: {relationships: [{from: 'client', to: 'interviewer', kind: 'sequence'}]}, fn: "s.first === 'client' && s.a.bubble === 1 && s.lookA.ask === 0", label: 'a sequence link client → interviewer puts the answer before the question'},
  ],
});

identicalBeforeChange('LAW-0163', 0.17);

suppliedTextSuite('LAW-0163', {
  fields: `const role = (id, i) => (p.roles[id] || p.actors[i].role);
    return [p.actors[0].name, p.actors[1].name, role('client', 0), role('interviewer', 1), p.props.question,
      p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts,
      p.comparisonLabels.guide, p.comparisonLabels.neutral]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Igual en ambas escenas'] : ['As supplied · no conclusion drawn', 'Same in both scenes']`,
});

ratioChecks('LAW-0163', 'layout fits; scenes stay large; the changed fact reads from the picture; guide clear of hands', [
  // review fixes (item 18): each scene ≥ 40 % of the FRAME width side by side, ≥ 80 % stacked (full width),
  // and the pair plus its band fill the design height (no empty half, labels shown or hidden)
  {at: [1], fn: "s.labelsFit && (s.arrangement === 'row' ? s.sceneFrac >= 0.4 : s.sceneFrac >= 0.8) && s.vFill >= 0.72", label: 'labels fit; scenes ≥ 40 % of the frame side by side, ≥ 80 % stacked; the pair fills the height'},
  // review fix: the one changed fact is large — an enlarged, numbered day strip (cells ≥ 36 px, numbers ≥ 16 px)
  {at: [1], fn: 's.insetCell >= 36 && s.numSize >= 16', label: 'enlarged numbered day strip: cells ≥ 36 px, numbers ≥ 16 px', tv: ['all']},
  // review fix: the guide never runs through a writing hand or pen
  {at: [0.82, 0.85, 1], fn: 's.guideHandClear >= 40', label: 'the comparison guide stays ≥ 40 px from every hand and pen'},
  {at: [0, 0.3, 0.42, 0.45, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 1], fn: 's.allReached && s.a.handFaceB >= 52 && s.b.handFaceB >= 52', label: 'pens reach every mark; the pen hand never overlaps the face of the interviewer'},
]);
