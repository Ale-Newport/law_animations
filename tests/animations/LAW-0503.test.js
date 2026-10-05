// LAW-0503 — Limitación contractual · contrast (two identical peg trays; one supplied status differs; the cord laid
// round the pegs leaves that category in a bay in one tray only).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actors), objectLabels (the props carry no names), finalState (the
// hold always shows both supplied statuses).
// acceptanceCheck (brief): continuity (60 fps: both bobbins), anchored objects (each bobbin is the cord's end at every
// frame; the bay pegs rise before the cord reaches them) and a transformation recognisable with the labels hidden (B's
// cord steps in round the changed tile). Contrast rules: identical before the change beat (labels on and off), one
// changed fact that alters the geometry (B's contour is longer and has one more bay), equal weight and timing, a
// closing guide on the changed tile in both scenes, a neutral note, no winner.
// Windows (LAW-0503.js): status line 0.18–0.26 · bay pegs 0.25–0.33 · cord 0.36–0.68 · statuses 0.69–0.74 · guide
// 0.73–0.78 · note 0.76–0.81 · key 0.78–0.83.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct06-rendered.js';

const ID = 'LAW-0503';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['bobA', 'bobB'],
  semantic: [
    {at: 0, fn: "s.lineShown === 0 && s.bayPegs === 0 && s.cord === 0 && s.guideShown === 0", label: 'base: identical scenes, nothing changed yet'},
    {at: 0.3, fn: "s.lineShown === 1 && s.cord === 0", label: 'the changed fact arrives before the cord is laid'},
    {at: 0.5, fn: "s.cord > 0.2 && s.cord < 0.9", label: 'the cords are laid at the same pace'},
    {at: 1, fn: "s.cord === 1 && s.baysB === s.baysA + 1 && s.lenB > s.lenA && s.guideShown === 1 && s.keyShown === 1 && s.layoutOk", label: 'hold: B has one more bay (longer contour); guide and key shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.baysA === s.baysB + 1 && s.lenA > s.lenB", label: 'alternative (reversed): A has the extra bay'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.cord === 1 && s.baysB === s.baysA + 1", label: 'labels hidden: the same difference'},
  ],
});

identicalBeforeChange(ID, 0.18);

ratioChecks(ID, 'layout fits; scenes side by side on wide boxes, stacked on tall ones; equal size', [
  {at: [0, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [1], fn: "s.sceneA.w === s.sceneB.w && s.sceneA.h === s.sceneB.h", label: 'the two scenes have the same size'},
  {at: [1], fn: "s.side ? s.sceneA.y === s.sceneB.y : s.sceneA.x === s.sceneB.x", label: 'side by side (wide) or stacked (tall)'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.scenarioLabels.a, p.scenarioLabels.b, ...p.categories.map(c => c.label), ...p.annotations.map(a => a.text)]",
  content: "return [...p.categories.map(c => c.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.55});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies limitation doctrine, caps or amounts (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
