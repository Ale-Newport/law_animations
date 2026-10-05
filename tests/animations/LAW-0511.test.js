// LAW-0511 — Ley y foro pactados · contrast (two identical boards; only the clause examined differs: in A the law
// signpost swings to its plaque, in B the forum signpost; the other signpost stays at rest).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actors), actionProgress and finalState. objectLabels =
// destinations; the changed fact is examinedA / examinedB.
// acceptanceCheck (brief): both scenes exist (equal size, side by side / stacked), exactly the indicated fact changes
// (identical before the change beat, labels on and off; afterwards only the examined clause's signpost moves) and no
// legal consequence is invented (banned-wording checks).
// Windows (LAW-0511.js): loupe 0.18–0.27 · band 0.26–0.32 · swing 0.36–0.50 · line 0.49–0.62 · loupe back 0.60–0.69 ·
// guide 0.70–0.75 · note 0.73–0.78 · key 0.75–0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct08-rendered.js';

const ID = 'LAW-0511';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['loupeA', 'loupeB'],
  semantic: [
    {at: 0, fn: "s.swing === 0 && s.line === 0 && s.guideShown === 0 && !s.movedA.some(Boolean) && !s.movedB.some(Boolean)", label: 'base: identical boards, both signposts at rest'},
    {at: 0.3, fn: "s.swing === 0 && s.lookA === 'changed'", label: 'the examined clause is chosen before any signpost moves'},
    {at: 1, fn: "s.movedA[0] && !s.movedA[1] && !s.movedB[0] && s.movedB[1] && s.line === 1 && s.guideShown === 1 && s.keyShown === 1 && s.layoutOk", label: 'hold: A law signpost moved only, B forum signpost moved only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "!s.movedA[0] && s.movedA[1] && s.movedB[0] && !s.movedB[1]", label: 'alternative (reversed)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.movedA[0] && s.movedB[1]", label: 'labels hidden: the same difference'},
  ],
});

identicalBeforeChange(ID, 0.18);

ratioChecks(ID, 'layout fits; equal scenes side by side on wide boxes, stacked on tall ones', [
  {at: [0, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [1], fn: "s.sceneA.w === s.sceneB.w && s.sceneA.h === s.sceneB.h", label: 'the two scenes have the same size'},
  {at: [1], fn: "s.side ? s.sceneA.y === s.sceneB.y : s.sceneA.x === s.sceneB.x", label: 'side by side (wide) or stacked (tall)'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum, p.scenarioLabels.a, p.scenarioLabels.b, ...p.annotations.map(a => a.text)]",
  content: "return [p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.55});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies conflict-of-laws or forum doctrine (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
