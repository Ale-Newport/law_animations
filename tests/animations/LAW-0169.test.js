// LAW-0169 — Declaración de testigo · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion, object anchoring and a transformation
// that stays recognizable with labels hidden (checked on semantic state, which does not
// depend on text).
// Recount clock (kit recountClock, U0 = 0.14, U1 = 0.81, n = 3): one fact spans s = 0.67/3.12 = 0.2147;
// fact i, share q → u = 0.14 + (i + 0.12 + q)·s. Statement i fills in on its card under the resting nib over
// q ∈ [0, 0.17]; the pen writes its stated-source label over [0.2, 0.53]; the other hand carries the card into
// the rail over [0.6, 0.81]; the pen hand pushes the row over [0.812, 0.912] — before the next statement.
//   fill:   fact0 0.166–0.202 · fact1 0.381–0.417 · fact2 0.595–0.632
//   label:  fact0 0.209–0.280 · fact1 0.424–0.494 · fact2 0.638–0.709
//   carry:  fact0 0.295–0.340 · fact1 0.509–0.554 · fact2 0.724–0.769
//   push:   fact0 0.340–0.362 · fact1 0.555–0.576
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0169';
const ONE = {props: {facts: [{text: 'A dog barked twice near the gate', source: 'received', via: 'the caretaker'}], sourceLabels: {observed: 'direct observation (as stated)', received: 'information received (as stated)'}}};

contractSuite(ID, {
  continuity: ['pen', 'handL', 'handR', 'handW', 'card0', 'card1', 'card2'],
  // default per-frame limit (90); the pen's own speed is audited much tighter below
  attach: [
    // the pen nib (from the solved pen hand) sits on the writing point of the card lying on the pad
    {from: 0.21, to: 0.279, a: 'pen', b: 'writeTarget', tol: 1.5},
    {from: 0.425, to: 0.494, a: 'pen', b: 'writeTarget', tol: 1.5},
    {from: 0.64, to: 0.708, a: 'pen', b: 'writeTarget', tol: 1.5},
    // the written card rides on the other hand from the pad into the rail slot
    {from: 0.296, to: 0.338, a: 'handR', b: 'gripR', tol: 1.5},
    {from: 0.511, to: 0.553, a: 'handR', b: 'gripR', tol: 1.5},
    {from: 0.726, to: 0.768, a: 'handR', b: 'gripR', tol: 1.5},
    // the pen hand pushes the row by the right edge of its last card
    {from: 0.343, to: 0.36, a: 'handL', b: 'gripL', tol: 1.5},
    {from: 0.558, to: 0.575, a: 'handL', b: 'gripL', tol: 1.5},
    // the witness holds the statement sheet the whole time
    {from: 0, to: 1, a: 'handW', b: 'docGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.cardAt.every(a => a === 'pad') && s.written.every(w => w === 0) && s.dictated.every(w => w === 0) && s.bubbles.every(b => b === 0)", label: 'rest: blank cards on the pad, nothing said, nothing written'},
    {at: 0.19, fn: "s.bubbles[0] > 0.9 && s.speaking && s.written[0] === 0 && s.dictated[0] > 0 && s.dictated[0] < 1 && s.fillNibIn", label: 'the witness says the first statement; it fills in on the top card under the resting nib; no label yet'},
    {at: 0.25, fn: "s.written[0] > 0 && s.written[0] < 1 && s.dictated[0] === 1 && s.cardAt[0] === 'pad' && s.bubbles[0] > 0.9", label: 'the clerk writes the stated-source label under the complete statement'},
    {at: 0.32, fn: "s.cardAt[0] === 'hand' && s.heldBy === 'r' && s.written[0] === 1", label: 'the other hand carries the written card to the rail'},
    {at: 0.35, fn: "s.shift > 0 && s.cardAt[0] === 'rail' && !s.railOnFace && s.dictated[1] === 0 && s.bubbles[1] === 0", label: 'the pen hand pushes the row along before the next statement is said'},
    {at: 0.4, fn: "s.cardAt[0] === 'rail' && s.slots[0] === 1 && s.dictated[1] > 0 && s.dictated[1] < 1 && s.fillNibIn && s.bubbles[1] > 0.9 && s.bubbles[0] === 0", label: 'second statement: its own bubble; it fills in on its own card under the nib'},
    {at: 0.45, fn: "s.written[1] > 0 && s.written[1] < 1 && s.dictated[1] === 1", label: 'second card labelled after its statement is complete'},
    {at: 0.61, fn: "s.cardAt[0] === 'rail' && s.cardAt[1] === 'rail' && s.written[2] === 0 && s.dictated[2] > 0 && s.bubbles[2] > 0.9", label: 'third statement said before its card is labelled'},
    {at: 0.81, fn: "s.cardAt.every(a => a === 'rail') && JSON.stringify(s.slots) === '[2,1,0]' && s.bubbles.every(b => b === 0)", label: 'main action complete by about 0.8: every card lined up'},
    {at: 1, fn: "JSON.stringify(s.railOrder) === '[0,1,2]' && s.rowAbuts && s.written.every(w => w === 1) && s.allReached && s.beat === 'hold' && !s.railOnFace && s.rowGapToWitness >= 0 && s.rowGapToWitness < 60", label: 'hold: the labelled facts stand in the order stated, abutting, right beside the witness'},
    {at: 1, fn: "JSON.stringify(s.sources) === JSON.stringify(['observed','observed','received'])", label: 'each card carries the source type as supplied'},
    {at: 1, fn: 's.labelsFit && s.notesShown === 1', label: 'default layout fits without cut text; notes shown in the hold'},
    {at: 0.45, params: {textVisibility: 'none'}, fn: "s.written[1] > 0 && s.cardAt[0] === 'rail' && s.bubbles[1] > 0.9", label: 'labels hidden: the same speaking / writing / lining-up action'},
    {at: 0.1, params: {textVisibility: 'none'}, fn: "s.written.every(w => w === 0) && s.dictated.every(w => w === 0) && s.cardAt.every(a => a === 'pad')", label: 'labels hidden: nothing written before the first statement'},
    {at: 1, params: {finalState: 'last-held'}, fn: "s.cardAt[2] === 'desk' && s.written[2] === 1 && s.cardAt[0] === 'rail' && s.cardAt[1] === 'rail' && !s.heldOnFace && s.allReached && s.gripR && Math.hypot(s.handR.x - s.gripR.x, s.handR.y - s.gripR.y) < 1.5", label: 'supplied final state last-held: the last card is written and held standing on the desk beside the face, not in the row'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && !s.cardAt.every(a => a === 'rail')", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: ONE, fn: "s.cardAt[0] === 'rail' && JSON.stringify(s.slots) === '[0]' && s.written[0] === 1", label: 'a single supplied fact becomes a single card'},
  ],
});

// Reviewer fixes, every preset × 16:9 / 1:1 / 9:16 × labels shown / hidden:
// - the pen nib never moves more than 60 design px per 60 fps frame (the old write windows strobed at 86–103);
// - no arm segment crosses the text of a card drawn behind the arms (a lifted card is drawn in front
//   of both arms, standing cards too), and no card ever covers the clerk's face;
// - the hold keeps every card upright and fully written.
ratioChecks(ID, 'pen speed, arms clear of card text, cards clear of the face', [
  {at: times(0.12, 0.82, 0.0025), fn: 's.penStep <= 60', label: 'pen nib moves at most 60 px per 60 fps frame'},
  {at: times(0.15, 0.85, 0.005), fn: 's.armOverText === 0', label: 'no arm crosses the text of a card behind the arms'},
  // round 2: text never appears on a card without the clerk's nib on that card; a carried card moves smoothly
  {at: times(0.14, 0.82, 0.0025), fn: 's.fillNibIn', label: 'during every statement fill the nib lies within the card being filled'},
  {at: times(0.14, 0.82, 0.0025), fn: 's.cardStep <= 75', label: 'every card moves at most 75 px per 60 fps frame'},
  {at: times(0, 1, 0.02), fn: '!s.railOnFace && !s.heldOnFace', label: 'no standing card covers the clerk’s face'},
  {at: [0.86, 1], fn: 's.written.every(w => w === 1) && s.dictated.every(w => w === 1) && s.allReached', label: 'hold: every card fully written, every hand on its target'},
]);

// Rendered text audit (shared harness): every supplied field drawn un-truncated at the hold, key text size,
// never smaller than the generic captions, and the "no conclusion drawn" key.
suppliedTextSuite(ID, {
  fields: 'return [...p.actors.map(a => a.name), p.actorLabels.witness || p.roles.witness, p.actorLabels.clerk || p.roles.clerk, ...p.props.facts.map(f => f.text), ...p.props.facts.map(f => f.via), p.props.sourceLabels.observed, p.props.sourceLabels.received, p.objectLabels.document, ...p.annotations.map(a => a.text)]',
  content: 'return [...p.actors.map(a => a.name), ...p.props.facts.map(f => f.text), p.props.sourceLabels.observed, p.props.sourceLabels.received]',
  captions: 'return ["as supplied", "según lo aportado", "Stated facts lined up", "Hechos declarados", "Last card written"]',
});
