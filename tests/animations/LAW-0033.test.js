// LAW-0033 — Notificación documentada · story. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0033', {
  allowTextOverlap: ['RECEIVED', 'RECIBIDO', 'Day', 'Día', 'DAY'], // the date stamp intentionally overprints the card's reference rows
  continuity: ['envelope', 'card', 'handA', 'handB1', 'handB2', 'penTip', 'stampTool'],
  attach: [
    // A carries the envelope out of the OUT tray and still holds it at the hatch
    {from: 0.201, to: 0.319, a: 'handA', b: 'envGripA', tol: 1.5},
    // B takes it at the shared point and lays it in the IN tray
    {from: 0.301, to: 0.419, a: 'handB1', b: 'envGripB', tol: 1.5},
    // the pen tip rides the signature stroke while writing
    {from: 0.431, to: 0.509, a: 'penTip', b: 'strokePoint', tol: 1.5},
    // the date stamp sits on the card's date box while pressed
    {from: 0.531, to: 0.554, a: 'stampTool', b: 'stampSpot', tol: 1.5},
    // B carries the torn-off card to the hatch; A takes it there and files it
    {from: 0.636, to: 0.699, a: 'handB1', b: 'cardGripB', tol: 1.5},
    {from: 0.686, to: 0.769, a: 'handA', b: 'cardGripA', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.envelopeHolder === 'out-tray' && s.cardHolder === 'envelope' && s.signature === 0 && !s.stamped", label: 'rest: envelope with a blank card in the OUT tray'},
    {at: 0.25, fn: "s.envelopeHolder === 'A'", label: 'the sender carries the envelope out of the OUT tray'},
    {at: 0.31, fn: "s.envelopeHolder === 'A+B'", label: 'both hands hold the envelope at the hatch (shared hand-off point)'},
    {at: 0.425, fn: "s.envelopeHolder === 'in-tray' && s.signature === 0 && !s.stamped && s.cardHolder === 'envelope'", label: 'the envelope reaches the IN tray before any record is made (cause precedes effect)'},
    {at: 0.47, fn: 's.penTouching && s.signature > 0 && s.signature < 1', label: 'the recipient signs the card with the pen on paper'},
    {at: 0.58, fn: "s.signature === 1 && s.stamped && s.cardHolder === 'envelope'", label: 'card signed and date-stamped before it is torn off'},
    {at: 0.66, fn: "s.cardHolder === 'B'", label: 'the recipient passes the card back towards the hatch'},
    {at: 0.695, fn: "s.cardHolder === 'A+B'", label: 'card hand-off at the hatch'},
    {at: 1, fn: "s.cardHolder === 'folder' && s.cardFiled && s.envelopeHolder === 'in-tray' && s.signature === 1 && s.stamped", label: 'ends with the envelope in the IN tray and the signed card filed'},
    {at: 1, params: {finalState: 'delivered-no-record'}, fn: "s.envelopeHolder === 'in-tray' && s.signature === 0 && !s.stamped && s.cardHolder === 'envelope'", label: 'no-record state: delivered, nothing signed, nothing returned'},
    {at: 1, params: {finalState: 'signed-kept'}, fn: "s.signature === 1 && s.stamped && s.cardHolder === 'envelope' && !s.cardFiled", label: 'kept state: signed and stamped, card stays with the recipient'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.envelopeHolder === 'B' && s.signature === 0", label: 'actionProgress freezes the action part-way'},
  ],
});
