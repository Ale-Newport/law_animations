// LAW-0500 — Cláusula de terminación · inspect (rebuilt: a reading desk; the case on a communication slip is
// substituted under a lens). Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions and priorities.
// acceptanceCheck (brief): continuity (60 fps: the magnifier), the lens is a real enlargement (≥ 1.5×, its smaller side
// ≥ 35 % of the frame's short side), the datum is legible in one place at a time (context copy blanked while the lens
// shows it), only the dependent geometry follows (the thread), the old value stays traceable ("was: …"), the context
// returns with the changed-datum marker, and seeking back restores the before-value. Labels hidden: same sequence.
// Windows (LAW-0500.js): magnifier in 0.13–0.22 · open 0.22–0.34 · lift 0.45–0.51 · was 0.50–0.55 · after 0.53–0.58 ·
// thread 0.60–0.70 · close 0.72–0.80 · magnifier out 0.76–0.84 · marker 0.80–0.84 · tags 0.82–0.90.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct05-rendered.js';

const ID = 'LAW-0500';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['lensCentre', 'lupaGrip'],
  semantic: [
    {at: 0, fn: "s.value === 'before' && s.linked && s.lensOpen === 0 && s.markerShown === 0 && s.contextDatum === 1", label: 'context: before-value, thread linked'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.copyShown === 1 && s.contextDatum === 0 && s.value === 'before'", label: 'lens open: the datum shown in the lens only'},
    {at: 0.62, fn: "s.value === 'after' && s.lensOpen === 1 && s.thread < 1", label: 'substituted in the lens; the thread follows'},
    {at: 1, fn: "s.value === 'after' && !s.linked && s.lensOpen === 0 && s.markerShown === 1 && s.contextDatum === 1 && s.finalShown === 1 && s.keyShown === 1 && s.layoutOk && s.lupaParked", label: 'back to context with the changed marker'},
    {at: 0.1, fn: "s.value === 'before' && s.markerShown === 0 && s.linked", label: 'seeking back restores the before-value'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'provided' && s.linked && s.value === 'after'", label: 'reverse substitution: a thread is drawn'},
    {at: 0, params: P('contrast-or-alternative'), fn: "!s.linked", label: 'reverse: no thread before'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.value === 'after'", label: 'labels hidden: same sequence'},
  ],
});

ratioChecks(ID, 'lens is a real inspection; one datum place', [
  {at: [0.4, 0.6], fn: 's.zoom >= 1.5', label: 'magnification ≥ 1.5×'},
  {dom: "(() => { const r = svg.querySelector('[data-node=\"lens-border\"]').getBoundingClientRect(); const R = svg.getBoundingClientRect(); return Math.min(r.width, r.height) / Math.min(R.width, R.height) >= 0.35; })()", at: [0.5], label: 'lens smaller side ≥ 35 % of the frame short side'},
  {at: times(0.2, 0.84, 0.01), fn: '!(s.copyShown >= 0.15 && s.contextDatum >= 0.15)', label: 'never two legible copies of the datum'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauseTitle, p.communication.label, p.afterValue, ...p.clauses, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [p.communication.label, p.afterValue, ...p.clauses]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies termination-rule wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
