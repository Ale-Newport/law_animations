// LAW-0121 — Texto y contexto · story. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: continuity of motion, object anchoring
// (the magnifier rides the solved hand), and a transformation that stays
// recognisable with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0121', {
  // The magnifier's glass shows a magnified COPY of the page on top of the
  // page itself: an intentional optical overprint. Only the copy's text nodes
  // carry the zero-width marker (COPY_MARK in the kit), so no other label pair
  // is exempted from the overlap heuristic.
  allowTextOverlap: ['\u200B'],
  continuity: ['hand', 'lens', 'lensGrip'],
  attach: [
    // from the moment the hand closes on the handle until it lets go at the
    // resting place, the magnifier's grip coincides with the solved hand
    {from: 0.121, to: 0.599, a: 'hand', b: 'lensGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "!s.lensHeld && s.magnification === 1 && !s.context.passage && !s.context.article && !s.cards.isolated && !s.cards.contextual", label: 'rest: magnifier on the desk, no reading and no context mark yet'},
    {at: 0.2, fn: "s.lensHeld && !s.lensOnWord && !s.isolated", label: 'the hand carries the magnifier towards the word before anything is enlarged'},
    {at: 0.38, fn: "s.lensHeld && s.lensOnWord && s.lensScale > 1.3 && s.magnification > 1.85 && s.isolated && !s.context.passage", label: 'the raised magnifier enlarges the key word and the rest is dimmed (read on its own)'},
    {at: 0.42, fn: "s.cards.isolated && !s.cards.contextual && !s.context.article", label: 'the isolated reading appears (attributed) before any context is drawn'},
    {at: 0.5, fn: "s.lensHeld && s.wordInPlace && !s.isolated && !s.context.passage", label: 'the lens is lowered: the word is back on its line before the context is ringed (cause before effect)'},
    {at: 0.7, fn: "!s.lensHeld && s.context.passage && s.context.article && s.context.occurrences && !s.context.rack", label: 'magnifier laid down; passage, full article and other occurrences marked'},
    {at: 1, fn: "s.context.passage && s.context.article && s.context.occurrences && s.context.rack && s.cards.isolated && s.cards.contextual && s.finalState === 'in-context' && s.occurrences === 2", label: 'hold: every context mark plus both attributed readings (no reading marked correct)'},
    {at: 0.38, params: {textVisibility: 'none'}, fn: "s.lensOnWord && s.magnification > 1.85 && s.isolated", label: 'labels hidden: the enlargement still happens'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.context.article && s.context.occurrences && s.context.rack && !s.lensHeld", label: 'labels hidden: the return into the full article still completes'},
    {at: 1, params: {finalState: 'enlarged'}, fn: "s.lensHeld && s.lensOnWord && s.magnification > 1.85 && !s.context.passage && s.cards.isolated && !s.cards.contextual", label: 'supplied final state "enlarged": the hold keeps the raised lens'},
    {at: 1, params: {finalState: 'returned'}, fn: "!s.lensHeld && s.context.article && !s.context.occurrences && !s.context.rack && !s.cards.contextual", label: 'supplied final state "returned": word back in the ringed article only'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.lensHeld && !s.lensOnWord && !s.context.passage", label: 'actionProgress freezes the action part-way (magnifier still travelling)'},
    {at: 1, params: {passages: {heading: 'Text 1 · Art. 4 (fictional)', lines: ['Each unit keeps a register of entries.', 'The register stays at the entrance.'], word: 'register', wordPassage: 0}}, fn: "s.occurrences === 1 && s.context.occurrences", label: 'occurrences are counted from the supplied text only (register: one other)'},
  ],
});

// Reviewer round B007: in the contrast-or-alternative preset (16:9) the leader
// of the note on the key word ran straight down through the article's lines.
// Every leader of the scene (reading-card leaders and note leaders, whatever
// they target) must never cross the article's printed text (heading, passage
// numbers, lines), and the book→slot ribbon must never run over the rack
// caption, another row or another book — every preset × ratio × labels shown /
// hidden, plus notes on every target and every supplied final state.
import {ratioChecks} from './texto-y-contexto-ratio-checks.js';

const WORD_NOTE = {target: 'word', text: 'Enlarged, then back in its line'};
const NOTES_1 = [WORD_NOTE, {target: 'rack', text: 'Where the author placed this text'}];
const NOTES_2 = [{target: 'article', text: 'The whole article'}, {target: 'lens', text: 'Magnifier laid down'}];
ratioChecks('LAW-0121', 'leaders never cross article text; ribbon clear of rack caption and other rows', [
  {at: [0.5, 0.8, 1], fn: 's.leaderTextHits === 0', label: 'no leader crosses the article text'},
  {at: [1], params: {annotations: [WORD_NOTE]}, fn: 's.leaderTextHits === 0', label: 'a note on the key word reaches it without crossing text'},
  {at: [1], params: {annotations: NOTES_1}, fn: 's.leaderTextHits === 0', label: 'notes on the word and the rack: no leader crosses the article text'},
  {at: [1], params: {annotations: NOTES_2}, fn: 's.leaderTextHits === 0', label: 'notes on the article and the magnifier: no leader crosses the article text'},
  {at: [1], params: {annotations: [WORD_NOTE], finalState: 'returned'}, fn: 's.leaderTextHits === 0', label: 'word note, final state "returned"'},
  {at: [1], params: {annotations: [WORD_NOTE], finalState: 'enlarged'}, fn: 's.leaderTextHits === 0', label: 'word note, final state "enlarged"'},
  {at: [0.75, 1], fn: 's.ribbonHits === 0', label: 'the book→slot ribbon crosses no caption, row or other book'},
]);
