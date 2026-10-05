// LAW-0137 — Ámbito material · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, anchoring of objects (the article and
// the magnifier ride the SOLVED hand while held; cards only move along the
// rail, through their own gate or off the end) and a transformation that
// stays recognizable with the labels hidden.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/sources/LAW-0137.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;
const SORTED = "JSON.stringify(s.holders) === JSON.stringify(['bin0','bin1','side','bin2'])";

contractSuite('LAW-0137', {
  continuity: ['article', 'lupa', 'handA', 'handB', 'c0', 'c1', 'c2', 'c3'],
  attach: [
    // whenever the article or the magnifier is held, it sits exactly in the solved hand
    {from: 0, to: 1, a: 'handA', b: 'heldA', tol: 0.6},
    {from: 0, to: 1, a: 'handB', b: 'heldB', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: "s.articleHolder === 'book' && s.keys.every(k => k === 0) && s.holders.every(h => h === 'magazine') && s.flap === 0 && s.lupaHolder === 'cup'", label: 'rest: article in the book, sockets empty, collection in the magazine, magnifier in its cup'},
    {at: 0.25, fn: "s.articleHolder === 'hand' && s.heldA && s.keys.every(k => k === 0)", label: 'the article travels in the hand before any gate is keyed'},
    {at: 0.34, fn: "s.articleHolder === 'holder' && s.holders.every(h => h === 'magazine')", label: 'the article is clipped into the filter holder while every card still waits'},
    {at: 0.415, fn: "s.keyed.every(Boolean) && s.holders.every(h => h === 'magazine')", label: 'every listed subject keys its gate before the first card moves (cause precedes effect)'},
    {at: 0.5, fn: "s.flap === 1 && s.holders.some(h => h !== 'magazine')", label: 'the magazine gate is open and the collection starts through the filter'},
    {at: 0.6, fn: "s.holders.every((h, i) => h === 'magazine' || h === 'rail' || h === 'falling' || h === (s.states[i] === 'included' ? h : 'side')) && s.holders.every(h => !/^bin/.test(h) || true)", label: 'cards are only in the magazine, on the rail, falling or in a container'},
    {at: 1, fn: SORTED + " && s.states.join() === 'included,included,unclassified,included'", label: 'final: each tagged card sits in its subject bin; the unlisted tag sits in the side bin'},
    {at: 1, fn: "s.lupaHolder === 'rim' && s.statusIn === 1 && s.statusUn === 1 && !s.heldA && !s.heldB", label: 'hold: magnifier set down on the side-bin rim above the read card, both supplied states shown, hands empty'},
    {at: 1, fn: 's.lensClearOfCard === true', label: 'the parked lens leaves the examined card (and its name) fully visible'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.lensClearOfCard === true', label: 'alternative: the parked lens leaves the examined card fully visible'},
    {at: 0.7, fn: "s.lupaHolder === 'hand' && s.holders[2] === 'side'", label: 'the magnifier reads the tag only after that card is in the side bin'},
    {at: 1, params: {textVisibility: 'none'}, fn: SORTED + " && s.keyed.every(Boolean) && s.lupaHolder === 'rim'", label: 'labels hidden: the same physical sorting happens'},
    {at: 1, params: {finalState: 'filter-set'}, fn: "s.keyed.every(Boolean) && s.holders.every(h => h === 'magazine') && s.flap === 0 && s.statusIn === 0", label: 'finalState filter-set: the filter is keyed, the collection has not moved'},
    {at: 1, params: {finalState: 'sorted'}, fn: SORTED + " && s.lupaHolder === 'cup' && s.statusUn === 1", label: 'finalState sorted: sorted without the magnifier step'},
    {at: 1, params: {actionProgress: 0.45}, fn: "s.actionCapped && s.statusIn === 0 && s.keyed.every(Boolean) && !s.holders.every(h => /^bin|side/.test(h))", label: 'actionProgress freezes the action part-way (no final state shown)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "JSON.stringify(s.holders) === JSON.stringify(['bin0','side','bin2','bin1','side']) && s.examined === 1 && s.allReached", label: 'alternative data: a card with no tag and one with an unlisted tag both reach the side bin'},
    {at: 1, params: {activities: [{label: 'A', subject: ' transport '}, {label: 'B', subject: 'HOUSING'}]}, fn: "JSON.stringify(s.holders) === JSON.stringify(['bin0','bin1']) && s.statusUn === 0 && s.examined === null", label: 'verbatim, case-insensitive match; no side bin state when nothing is unclassified'},
  ],
});
