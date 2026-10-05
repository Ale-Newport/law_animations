// LAW-0497 — Cláusula de terminación · story (rebuilt: a messenger pins a letter on a cork board). Contract battery +
// ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions and priorities; clauses = the sections of the termination clause.
// acceptanceCheck (brief): continuity of the motion (60 fps: the messenger's hand, the letter, the magnifier), anchored
// objects (the letter moves only in the messenger's hand at a constant grip until it is pinned; the magnifier moves only
// in the hand by its grip) and a transformation recognisable with the labels hidden (walk, pin, unfold, magnifier, thread).
// Cause precedes effect: the letter is pinned before the magnifier is taken; the thread is drawn only after the
// magnifier has reached the case line. Legal content: no termination doctrine (noConditionRuleWords), no jurisdiction
// (conceptNeutral); "not described" is neutral (no thread, no conclusion).
// Windows (LAW-0497.js): walk 0.15–0.30 · lift 0.30–0.355 · unfold 0.355–0.39 · pin 0.39–0.42 · to magnifier 0.42–0.48 ·
// raise 0.48–0.56 · thread 0.58–0.68 · lower 0.63–0.70 · hand to rest 0.70–0.76 · tags 0.74–0.84.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, headFloor, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED, CONFIG_WORDS} from './ct05-rendered.js';

const ID = 'LAW-0497';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['hand', 'letterPos', 'lupaGrip', 'lensCentre'],
  attach: [
    {from: 0, to: 0.415, a: 'hand', b: 'letterGrip', tol: 1.5},
    {from: 0.485, to: 0.695, a: 'hand', b: 'lupaGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.letterAt === 'carried' && s.unfolded === 0 && !s.pinned && s.thread === 0 && s.finalShown === 0", label: 'rest: the folded letter in the messenger\'s hand'},
    {at: 0.25, fn: "s.phase === 'walking' && s.holdsLetter", label: 'the messenger walks up carrying the letter'},
    {at: 0.38, fn: "s.unfolded > 0 && s.holdsLetter && !s.pinned", label: 'the letter is unfolded at the pin spot'},
    {at: 0.43, fn: "s.letterAt === 'spot' && s.pinned && s.unfolded === 1 && !s.holdsLupa && s.thread === 0", label: 'pinned before the magnifier is taken'},
    {at: 0.57, fn: "s.holdsLupa && Math.hypot(s.lensCentre.x - s.caseCentre.x, s.lensCentre.y - s.caseCentre.y) < 2 && s.thread === 0", label: 'the magnifier over the case line before the thread'},
    {at: 0.65, fn: "s.thread > 0 && s.thread < 1", label: 'the thread is drawn after the magnifier reached the case line'},
    {at: 1, fn: "s.linked && s.linkedSection === 2 && s.lupaParked && s.finalShown === 1 && s.keyShown === 1 && s.layoutOk && s.allReached", label: 'hold: linked to section 2, magnifier parked, tags shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'undescribed' && s.thread === 0 && !s.linked && s.pinned && s.lupaParked", label: 'not described: pinned, no thread — neutral'},
    {at: 1, params: P('long-labels-stress'), fn: "s.linked && s.linkedSection === 3 && s.layoutOk", label: 'stress: section 3 linked'},
    {at: 1, params: {actionProgress: 0.3}, fn: "!s.pinned && s.thread === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.pinned && s.linked", label: 'labels hidden: the same action'},
  ],
});

ratioChecks(ID, 'layout fits, reach, order, parked magnifier', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand target is within reach'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0.44], fn: "s.pinned && !s.holdsLupa", label: 'pinned before the magnifier is taken'},
  // (AUTHORING item 12: the parked magnifier never rests on the letter)
  {at: [1], fn: 's.lupaBox.y >= s.letterBox.y + s.letterBox.h - 0.5 || s.lupaBox.x >= s.letterBox.x + s.letterBox.w', label: 'the parked magnifier is clear of the letter'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauseTitle, p.communication.label, p.stateLabels[p.finalState], ...p.clauses, p.messenger.name, p.objectLabels.ledge, ...p.annotations.map(a => a.text)]",
  content: "return [p.communication.label, p.stateLabels[p.finalState], ...p.clauses]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {count: 1, floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 55], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies termination-rule or configuration wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    expect(JSON.stringify(pr.params).match(CONFIG_WORDS), pr.name).toBeNull();
  }
});
