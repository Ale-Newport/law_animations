// LAW-0171 — Declaración de testigo · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (how the witness says
// they know it: a direct line of sight in A, a route through another person in B — geometry and
// sequence, not only text or colour) and no legal consequence is invented (same statement, same
// card; only the stated source tag differs; no winner, score or weight).
// Timeline: change 0.17–0.40 (A: eye + line of sight from what happened; B: the neighbour walks in, looks,
// then a "told" arrow to the witness) · parallel recount (kit recountClock over 0.42–0.77, one card: the pen
// comes to rest on the card, the statement is said and fills in under it 0.458–0.511, the label is written
// 0.520–0.623, the other hand carries the card 0.645–0.711) · guide 0.77–0.86.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const ID = 'LAW-0171';

contractSuite(ID, {
  continuity: ['penA', 'penB', 'handRA', 'handRB', 'handLA', 'cardPosA', 'cardPosB', 'neighbourAt'],
  attach: [
    // both pens write the label on their card lying on the pad; both written cards ride the other hand into the rail
    {from: 0.522, to: 0.621, a: 'penA', b: 'writeTargetA', tol: 1.5},
    {from: 0.522, to: 0.621, a: 'penB', b: 'writeTargetB', tol: 1.5},
    {from: 0.647, to: 0.709, a: 'handRA', b: 'gripRA', tol: 1.5},
    {from: 0.647, to: 0.709, a: 'handRB', b: 'gripRB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.routeA === 'none' && s.routeB === 'none' && !s.neighbourInScene", label: 'base: two identical complete scenes, nothing differs yet'},
    {at: 0.16, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.header === 0', label: 'still identical just before the change beat; no scenario label yet'},
    {at: 0.3, fn: 's.lookA.eye > 0 && s.lookA.neighbour === 0 && s.lookB.neighbour > 0 && s.lookB.eye === 0 && s.writtenA === 0 && s.writtenB === 0', label: 'change: A gains an eye and a line of sight; B gains a person — before anything is written'},
    {at: 0.41, fn: "s.routeA === 'direct' && s.routeB === 'via-informant' && s.neighbourInScene", label: 'the route to what happened is direct in A and passes through the neighbour standing in B'},
    {at: 0.58, fn: 's.sameAction && s.writtenA > 0 && s.writtenA < 1 && s.writtenA === s.writtenB', label: 'parallel: both clerks label the same card with identical timing'},
    {at: 0.47, fn: 's.lookA.bubble > 0.9 && s.lookB.bubble > 0.9 && s.lookA.bubble === s.lookB.bubble', label: 'both witnesses say the same statement at the same moment'},
    {at: 1, fn: "s.cardA === 'rail' && s.cardB === 'rail' && s.writtenA === 1 && s.writtenB === 1 && s.allReached", label: 'hold: both cards written and set beside their witness'},
    {at: 1, fn: "s.sourceA === 'observed' && s.sourceB === 'received' && s.guideProgress === 1 && s.guideRouted", label: 'guide drawn (routed through free space): only the stated source differs (as supplied)'},
    {at: 0.7, fn: 's.guideProgress === 0', label: 'no guide or comparison before the end'},
    {at: 1, fn: 's.layoutFits && s.sideClear', label: 'layout fits (no cut text; nothing clipped at a panel side)'},
    {at: 0.3, params: {textVisibility: 'none'}, fn: 's.lookA.eye > 0 && s.lookB.neighbour > 0 && s.lookA.neighbour === 0', label: 'labels hidden: the change reads as geometry (a person in B)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.routeA === 'direct' && s.routeB === 'via-informant' && s.cardA === 'rail' && s.neighbourInScene", label: 'labels hidden: the same end state; the neighbour stands in B'},
  ],
});

// Reviewer fixes in every preset × ratio × labels shown / hidden: each scene takes ≥ 40 % of the width side by
// side (full width stacked) with people at a readable size; nothing is clipped at a panel side; the difference
// at the hold is a person standing in B's scene; the guide leaders run only through the free corridor.
ratioChecks(ID, 'scene size, clipping, physical difference, guide routing', [
  {at: [1], fn: '(s.sceneShare >= 0.4) && s.witnessPx >= (P.props.statement.length > 50 ? 125 : 150) && s.sideClear && s.layoutFits', label: 'scenes ≥ 40 % wide, witness ≥ 150 px (long-labels ≥ 125 px), no side clipping, layout fits'},
  {at: [1], fn: 's.neighbourInScene && s.lookB.neighbour === 1 && s.lookA.neighbour === 0 && s.guideRouted', label: 'hold: the neighbour stands in B (not in A); the guide is routed through free space'},
  // round 2 (item 7): the neighbour appears whole at her place — never a sliver cut by the panel's edge
  {at: [0.17, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.28, 0.3, 0.35, 0.5, 1], fn: '!s.neighbourClipped', label: 'the neighbour is never partially clipped by B’s panel'},
  // the long-labels square has no free corridor between its 4-line name chips: rings + chip only (no leaders)
  {at: [1], tv: ['all'], fn: 's.guideLinked || (P.props.statement.length > 50 && s.textPx < 17)', label: 'the guide chip is joined to both rings'},
]);

// A and B identical before the change beat (shared harness), every preset × ratio, labels shown and hidden.
identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [...p.actors.map(a => a.name), p.roles.witness, p.roles.clerk, p.roles.informant, p.props.statement, p.props.via, p.props.sourceLabels.observed, p.props.sourceLabels.received, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]',
  content: 'return [...p.actors.map(a => a.name), p.props.statement, p.props.sourceLabels.observed, p.props.sourceLabels.received, p.scenarioA.label, p.scenarioB.label]',
  captions: 'return ["as supplied", "según lo aportado"]',
});
