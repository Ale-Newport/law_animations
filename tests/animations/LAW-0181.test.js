// LAW-0181 — Interpretación lingüística · story. Contract battery + ID-specific checks encoding
// the brief's acceptanceCheck: continuous motion, props anchored to the solved hands (the pen nib
// on each shorthand stroke while the interpreter writes), and an action that reads with labels
// hidden: the first speaker's bubble keeps its own tail, the interpreter's rendering has its tail
// at HER mouth, a ribbon links the two bubbles and the listener turns to the rendering.
// Windows (LAW-0181.js W): interpreter turns to the speaker 0.10–0.17; speaker's bubble 0.15–0.19,
// talking 0.16–0.37; strokes 0.20–0.25 / 0.265–0.315 / 0.33–0.37; pen back 0.375–0.42; turn to the
// listener 0.42–0.48; rendering bubble 0.49–0.53, talking 0.50–0.66; ribbon 0.52–0.62; listener
// turns 0.51–0.58; tag, key and callout complete by 0.87.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {NO_CARD_ON_FACE, LABEL_OWNS_CONNECTOR} from './interpretacion-linguistica-checks.js';

contractSuite('LAW-0181', {
  continuity: ['handA', 'farA', 'handB', 'farB', 'handIL', 'handIR', 'pen'],
  continuityLimit: 45,
  attach: [
    // while a shorthand stroke is written the solved pen nib is on the stroke (noteTarget is null otherwise)
    {from: 0, to: 1, a: 'pen', b: 'noteTarget', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.bubbleS === 0 && s.bubbleR === 0 && s.ribbon === 0 && s.notes.every(v => v === 0) && !s.speakingS && !s.speakingI && s.iFaces === 'none'", label: 'rest: nobody speaks, no bubble, no note, interpreter facing forward'},
    {at: 0.24, fn: "s.speakingS && s.bubbleS === 1 && s.bubbleR === 0 && s.iFaces === 'src' && s.notes[0] > 0 && s.noteTarget !== null", label: 'the first speaker speaks; the interpreter turns to listen and writes (nib on the stroke)'},
    {at: 0.4, fn: "!s.speakingS && s.notes.every(v => v === 1) && s.bubbleR === 0 && s.ribbon === 0 && s.bubbleS === 1", label: 'cause before effect: words given and noted before any rendering'},
    {at: 0.5, fn: "s.iFaces === 'dst' && s.bubbleR > 0 && s.bubbleS === 1", label: 'the interpreter turns to the listener and her own bubble opens'},
    {at: 0.58, fn: 's.speakingI && s.ribbon > 0 && s.ribbon < 1 && s.bubbleR === 1', label: 'the ribbon is drawn from the first bubble to the rendering while she speaks'},
    {at: 0.72, fn: 's.ribbon === 1 && s.bubbleR === 1 && s.bubbleS === 1 && s.dstTurned === 1 && !s.speakingI && !s.speakingS', label: 'main action complete by u = 0.72'},
    {at: 1, fn: "s.allReached && s.keyShown && s.labelsFit && s.finalState === 'rendering-given' && s.bubbleS === 1 && s.bubbleR === 1 && s.ribbon === 1 && s.tailClearS && s.tailClearR", label: 'hold: both bubbles kept with their own tails, linked; key shown'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.bubbleS === 1 && s.bubbleR === 1 && s.ribbon === 1 && s.dstTurned === 1 && s.iFaces === 'dst'", label: 'the action completes identically with labels hidden'},
    {at: 1, params: {finalState: 'words-noted'}, fn: 's.bubbleR === 0 && s.ribbon === 0 && s.notes.every(v => v === 1) && s.bubbleS === 1', label: 'supplied state: words given and noted, no rendering'},
    {at: 0.25, params: {relationships: [{from: 'b', to: 'a', kind: 'sequence'}]}, fn: "s.first === 'b' && s.speakingS && s.iFaces === 'src' && s.tipS.x > s.tipR.x", label: 'a sequence link B → A makes B speak first (the rendering goes towards A)'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.ribbon === 0 && s.bubbleR === 0', label: 'actionProgress freezes the action part-way'},
  ],
});

suppliedTextSuite('LAW-0181', {
  fields: `const role = id => (p.actorLabels[id] || p.roles[id]);
    return [p.actors[0].name, p.actors[1].name, p.actors[2].name, role('a'), role('b'), role('interpreter'), p.languages.a, p.languages.b,
      p.props.utterance, p.props.rendering, p.objectLabels.notes, p.objectLabels.link, ...p.annotations.map(a => a.text)]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Interpretación dada (según lo aportado)'] : ['As supplied · no conclusion drawn', 'Rendering given (as supplied)']`,
});

const EVERY = [0, 0.1, 0.18, 0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.4, 0.42, 0.5, 0.6, 0.7, 1];
ratioChecks('LAW-0181', 'layout fits; tails beside mouths; labels by their ribbon; no card over a face; every IK target reached', [
  {at: [1], fn: 's.labelsFit', label: 'labels fit without truncation or overlap', tv: ['all']},
  // each tail ends beside its own speaker's mouth, clear of the face, and crosses no head
  {at: [0.3, 0.6, 1], fn: 's.tailClearS && s.tailClearR', label: 'speech tails end beside the mouth, off the face'},
  {at: [1], fn: 's.leaderMax <= 170 && s.linkDist !== null && s.linkDist <= 30', label: 'callout leaders ≤ 170 px; the ribbon label within 30 px of its ribbon', tv: ['all']},
  {at: EVERY, fn: 's.allReached', label: 'every IK target (pen strokes, gestures) is reached'},
  // rendered: no bubble body, tab or card over any head, sampled through the clip
  {at: [0.17, 0.2, 0.3, 0.45, 0.5, 0.52, 0.55, 0.6, 0.7, 0.8, 0.9, 1], dom: NO_CARD_ON_FACE, label: 'rendered: no bubble or card covers a head or face'},
  // rendered: the ribbon label's nearest connector is the ribbon (≤ 40 px)
  {at: [1], dom: LABEL_OWNS_CONNECTOR, label: 'rendered: the link label sits beside its own ribbon', tv: ['all']},
]);
