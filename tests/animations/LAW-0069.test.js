// LAW-0069 — Comprobación de jurisdicción · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuous motion, objects anchored (card in the hand, then in the
// slot; documents on the rail), and the separation is recognisable with labels hidden
// (same placement of every document whatever the label visibility).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0069', {
  continuity: ['hand', 'card', 'pulse', 'doc0', 'doc1', 'doc2', 'doc3', 'doc4', 'doc5'],
  attach: [
    // the card follows the solved hand until it is released in the slot, then stays there
    {from: 0, to: 0.249, a: 'hand', b: 'cardGrip', tol: 1.5},
    {from: 0.251, to: 1, a: 'cardGrip', b: 'slotGrip', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.docs.every(d => d.state === 'library') && s.cardHolder === 'hand' && s.keyed === 0 && s.bladeAngle === 0", label: 'rest: documents in the library, card in the hand, reader not keyed'},
    {at: 0.22, fn: "s.cardHolder === 'hand' && s.docs.every(d => d.state === 'library')", label: 'the card is carried to the terminal before anything moves'},
    {at: 0.3, fn: "s.cardInserted && s.cardHolder === 'slot' && s.docs.every(d => d.state === 'library')", label: 'card released in the slot before the first document leaves'},
    {at: 0.372, fn: "s.keyed === 1 && s.reading === 'DOC-11' && s.docs[0].state === 'reading'", label: 'the first document stops under a keyed reader'},
    {at: 0, fn: 's.switchOk && s.readBeforeFlip && s.departAfterSet', label: 'the switch turns only after the read and is set before each document passes it'},
    {at: 0.6, fn: "s.placedA.length >= 1 && s.placedB.length >= 1 && s.docs.some(d => ['library', 'moving', 'waiting', 'reading'].includes(d.state))", label: 'documents are separated one by one during the action'},
    {at: 0, fn: 's.minSheetGap >= 12 && s.readerGap >= 90', label: 'documents queue outside the arch: sheets never overlap, and the next one enters only when the previous one is at least half an arch ahead'},
    {at: 0.4, fn: "s.docs.filter(d => d.state === 'reading').length <= 1 && s.docs.some(d => d.state === 'waiting')", label: 'one document under the reader at a time while the next waits outside the arch'},
    {at: 1, fn: 'JSON.stringify(s.placedA) === JSON.stringify(s.expectedA) && JSON.stringify(s.placedB) === JSON.stringify(s.expectedB)', label: 'ends with exactly the documents declaring the card jurisdiction in rack A, the rest in rack B'},
    {at: 1, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.placedA) === JSON.stringify(['DOC-11','DOC-13','DOC-15']) && JSON.stringify(s.placedB) === JSON.stringify(['DOC-12','DOC-14'])", label: 'the same separation with every label hidden'},
    {at: 1, params: {relevant: 'j2'}, fn: "JSON.stringify(s.placedA) === JSON.stringify(['DOC-12']) && s.placedB.length === 4", label: 'marking another jurisdiction on the card changes which documents go to rack A'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.docs.every(d => d.state === 'library') && s.keyed === 1 && s.cardInserted", label: 'pending: the card keys the filter, no document is run'},
    {at: 1, params: {actionProgress: 0.45}, fn: "s.actionCapped && s.docs.some(d => d.state === 'library')", label: 'actionProgress freezes the run part-way'},
    {at: 0.45, fn: 's.allReached', label: 'hand targets stay within reach'},
    // round-4 review: the card crossed the researcher's face on its way to the slot
    ...[0.11, 0.125, 0.14, 0.155, 0.17, 0.185, 0.2].map(at => ({at, fn: 's.cardClearOfFace && s.allReached', label: 'the card never passes in front of the researcher\'s face on its way to the slot'})),
    // round-6 review: the card still read as crossing her face (it rose level with the head
    // beside the nose); the terminal is table-height, so the card stays below the chin
    ...[0, 0.1, 0.12, 0.14, 0.155, 0.17, 0.185, 0.2, 0.22, 0.25, 0.3].map(at => ({at, fn: 's.faceGap >= 6', label: 'the card keeps a visible gap below the chin (or right of the nose) at every moment of the carry'})),
    {at: 0.15, fn: 's.cardInFront', label: 'while carried below the slot the card is in front of the terminal head'},
    {at: 0.22, fn: '!s.cardInFront && s.cardHolder === \'hand\'', label: 'lowered into the slot, the card goes behind the terminal head'},
  ],
});
