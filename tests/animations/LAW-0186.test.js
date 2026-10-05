// LAW-0186 — Mediación entre partes · mechanism. Contract battery + ID-specific checks.
// Acceptance (brief): every connector ends at its element, the order does not
// change when seeking, and a plain relation is never drawn as causation.
import {contractSuite} from '../harness/contract.js';

/** preset params (kept in sync with LAW-0186.presets.json) */
const LONG = {"actors": [{"name": "Maria-Fernanda Castellanos Villavicencio", "role": "Party A"}, {"name": "Oluwaseun Bartholomew-Nakamura", "role": "Party B"}, {"name": "Anne-Katrin Vandenberghe-Østergaard", "role": "Mediator"}], "props": {"agendaTitle": "Agenda for the joint session", "agendaItems": ["Opening account by the tenant association representative", "Opening account by the property manager representative", "Questions and clarifications from both sides"], "speech": {"a": "", "b": ""}}, "elements": [{"id": "mediator", "label": "Neutral third person organising turns"}, {"id": "a", "label": "Tenant association representative"}, {"id": "b", "label": "Property manager representative"}, {"id": "agenda", "label": "Agenda and order of speaking turns"}], "relationships": [{"from": "mediator", "to": "a", "kind": "communication", "label": "gives the floor for the first turn"}, {"from": "mediator", "to": "b", "kind": "communication", "label": "gives the floor for the second turn"}, {"from": "a", "to": "b", "kind": "relation", "label": "address each other through the mediator"}, {"from": "mediator", "to": "agenda", "kind": "relation", "label": "follows the written order"}], "relationLabels": {"relation": "plain relation (no direction)", "communication": "communication between people", "sequence": "sequence of steps", "causal": "causal link (as supplied)"}};
const ALT = {"actors": [{"name": "Priya Lindqvist", "role": "Party A", "appearance": {"skin": 1, "hair": "long", "hairColor": 3, "outfit": 2}}, {"name": "Jonah Adeyemi", "role": "Party B", "appearance": {"skin": 4, "hair": "buzz", "hairColor": 5, "outfit": 0, "glasses": true}}, {"name": "Marta Sousa", "role": "Mediator", "appearance": {"skin": 2, "hair": "bun", "hairColor": 1, "outfit": 3}}], "props": {"agendaTitle": "Session plan", "agendaItems": ["Party B: opening", "Party A: opening", "Next meeting date"], "speech": {"a": "", "b": ""}}, "elements": [{"id": "mediator", "label": "Mediator"}, {"id": "a", "label": "Party A"}, {"id": "b", "label": "Party B"}, {"id": "agenda", "label": "Session plan"}], "relationships": [{"from": "agenda", "to": "mediator", "kind": "sequence", "label": "sets the order"}, {"from": "mediator", "to": "b", "kind": "communication", "label": "gives the floor"}, {"from": "mediator", "to": "a", "kind": "communication", "label": "gives the floor"}, {"from": "a", "to": "b", "kind": "relation", "label": "no direct exchange"}], "focusElement": "agenda", "traversalOrder": ["agenda", "mediator", "b", "mediator", "a"]};

contractSuite('LAW-0186', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.slots[0] === null && s.slots[1] === null', label: 'starts with an empty turn-order card and no token on the plan'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all relationships exist before the token moves'},
    {at: 0.44, fn: 's.slots[0] === null && s.slots[1] === null && s.floor === null', label: 'no slot fills before the token reaches a party'},
    {at: 0.445, fn: 's.focusScale > 1.1', label: 'the focus element (mediator) enlarges while the token passes'},
    {at: 1, fn: "s.slots[0] === 'a' && s.slots[1] === 'b' && s.floor === 'b'", label: 'ends with the order A → B recorded and B holding the floor'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['mediator','a','mediator','b'])", label: 'the token follows the supplied traversal order'},
    {at: 0.75, fn: 's.connectorGaps.length > 0 && s.connectorGaps.every(g => g <= 16)', label: 'every traversed connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, params: {traversalOrder: ['mediator', 'b', 'mediator', 'a']}, fn: "s.slots[0] === 'b' && s.slots[1] === 'a' && s.floor === 'a'", label: 'a different traversal order fills the card in that order'},
    {at: 0.62, fn: "s.slots[0] === 'a' && s.slots[1] === null && s.floor === null", label: 'between turns the floor returns to the mediator (A done, B not yet)'},
    {at: 1, fn: 's.labelClearance >= 0', label: 'relation labels sit beside the connectors: the token never passes over one'},
    {at: 1, params: LONG, fn: 's.labelClearance >= 0', label: 'long labels: the token never passes over a relation label'},
    {at: 1, params: ALT, fn: "s.labelClearance >= 0 && s.slots[0] === 'b' && s.slots[1] === 'a'", label: 'alternative (starts at the agenda): labels clear of the token, order B → A'},
  ],
});
