// LAW-0161 — Entrevista a cliente · story. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: continuous motion, props anchored to the
// solved hands (the question list in the interviewer's far hand, the pen in the
// near hand, the nib on each mark), and an exchange that reads with labels hidden.
// Default schedule (see LAW-0161.js, unit 0.1): account 0.15–0.32 · ask 0 0.32–0.425
// (mark 0.378–0.404) · ask 1 0.425–0.53 (mark 0.483–0.509) · clarify 0.53–0.68;
// the pen returns to rest 0.52–0.58; state tag, key and callout complete by 0.88.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

contractSuite('LAW-0161', {
  continuity: ['handA', 'farA', 'handB', 'gripB', 'pen'],
  continuityLimit: 45,
  attach: [
    // the question list never leaves the interviewer's far hand
    {from: 0, to: 1, a: 'gripB', b: 'boardGrip', tol: 1.5},
    // while a question is marked, the solved pen nib is on the mark's path (tickTarget is null otherwise)
    {from: 0, to: 1, a: 'pen', b: 'tickTarget', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: 's.bubbleA === 0 && s.asked === 0 && s.grow === 0 && s.askOpen === 0 && !s.speakingA && !s.speakingB', label: 'rest: nobody speaks, no question marked, no bubble'},
    {at: 0.25, fn: 's.speakingA && s.bubbleA === 1 && s.askOpen === 0 && s.asked === 0', label: 'the client tells the account first (sequence client → interviewer)'},
    {at: 0.39, fn: 's.askOpen > 0.9 && s.ticks[0] > 0 && s.ticks[0] < 1 && s.tickTarget !== null', label: 'the interviewer asks the first question and the pen is marking it'},
    {at: 0.45, fn: 's.ticks[0] === 1 && s.ticks[1] === 0 && s.grow === 0', label: 'one question marked before the next one; nothing clarified yet'},
    {at: 0.58, fn: 's.ticks[1] === 1 && s.speakingA && s.grow > 0 && s.clarifiedShown < 1', label: 'the answer follows the question: the bubble grows as the client speaks'},
    {at: 0.8, fn: 's.asked === 2 && s.grow === 1 && s.clarifiedShown === 1 && !s.speakingA && !s.speakingB', label: 'main action complete by u = 0.8'},
    {at: 1, fn: "s.asked === 2 && s.ticks[2] === 0 && s.grow === 1 && s.clarifiedShown === 1 && s.bubbleA === 1 && s.allReached && s.keyShown && s.finalState === 'detail-clarified' && s.labelsFit", label: 'hold: account kept, clarified detail added, two questions marked, third still open, key shown'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.asked === 2 && s.grow === 1 && s.clarifiedShown === 1 && s.bubbleA === 1', label: 'the exchange completes identically with labels hidden'},
    {at: 1, params: {finalState: 'account-given'}, fn: "s.asked === 0 && s.grow === 0 && s.bubbleA === 1 && s.events === 'account'", label: 'supplied state: only the account is given'},
    {at: 1, params: {finalState: 'questions-asked'}, fn: 's.asked === 2 && s.grow === 0 && s.clarifiedShown === 0', label: 'supplied state: questions asked, nothing clarified'},
    {at: 0.2, params: {relationships: [{from: 'interviewer', to: 'client', kind: 'sequence'}]}, fn: "s.first === 'interviewer' && s.events.startsWith('ask0>account') && s.askOpen > 0.9 && s.bubbleA === 0", label: 'a sequence link interviewer → client makes the first question come before the account'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.asked === 0', label: 'actionProgress freezes the action part-way'},
  ],
});

suppliedTextSuite('LAW-0161', {
  fields: `const role = (id, i) => (p.actorLabels[id] || p.roles[id] || p.actors[i].role);
    return [p.actors[0].name, p.actors[1].name, role('client', 0), role('interviewer', 1), p.props.listTitle, ...p.props.questions,
      p.props.account, p.props.clarification, p.objectLabels.clarified, ...p.annotations.map(a => a.text)]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Dato aclarado'] : ['As supplied · no conclusion drawn', 'Detail clarified']`,
});

const EVERY = [0, 0.2, 0.3, 0.33, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.44, 0.46, 0.48, 0.49, 0.5, 0.51, 0.52, 0.54, 0.56, 0.62, 0.7, 1];
ratioChecks('LAW-0161', 'layout fits; tails, callouts and the pen arm clear; every IK target reached', [
  {at: [1], fn: 's.labelsFit', label: 'labels fit without truncation or overlap', tv: ['all']},
  // review fix: the account tail ends just in front of the client's mouth, never on her face / eye
  // (tip ≥ 60 units from the head centre, level with the lips); the "?" tail ends at the interviewer's mouth
  {at: [0.3, 0.5, 1], fn: 's.tailClear && s.askTailClear', label: 'speech tails end in front of the mouth, off the face'},
  // review fix: callouts sit near their targets (leader ≤ 170 px at 1080p)
  {at: [1], fn: 's.leaderMax <= 170', label: 'every callout leader is short (≤ 170 px)', tv: ['all']},
  // review fix: the pen hand and forearm never rise against the interviewer's cheek (≥ 58 units from her face centre)
  {at: EVERY, fn: 's.allReached && s.handFaceB >= 58 && s.forearmFaceB >= 58 && s.handAOffBoard', label: "pen hand and forearm stay clear of the interviewer's face; the client's hand never covers a question"},
]);
