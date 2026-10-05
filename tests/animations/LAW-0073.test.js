// LAW-0073 — Matriz de autoridades · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchoring (every pin and note is
// carried by the solved hand between its card/pad and its cell — never moving on its
// own) and a transformation that stays recognizable with the labels hidden.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/research/LAW-0073.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;
// caption-safe margins that make a 1920×1080 frame's content box square-shaped (the 1:1 composition)
const SQUARE = {safeArea: {top: 0.06, bottom: 0.2, left: 0.25, right: 0.25}};

contractSuite('LAW-0073', {
  continuity: ['hand', 'pin0', 'pin1', 'pin2', 'note0'],
  attach: [
    // whenever an item is held, it sits exactly in the solved hand (all frames, all ratios)
    {from: 0, to: 1, a: 'hand', b: 'held', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: "s.holders.every(h => h === 'card') && s.noteHolders.every(h => h === 'pad') && s.columnLit.every(v => v === 0) && s.flags.every(v => v === 0)", label: 'rest: every pin rests on its card, notes on the pad, no column lit, no flag'},
    {at: 0.14, fn: "s.holders.every(h => h === 'card') && !s.held", label: 'nothing is carried before the action beat'},
    {at: 0.245, fn: "s.holders[0] === 'hand' && s.held && Math.hypot(s.held.x - s.hand.x, s.held.y - s.hand.y) < 0.6", label: 'the first pin travels in the hand'},
    {at: 0.3, fn: "s.pinned[0] && s.pinAtCell[0] && s.columnLit[0] > 0 && s.holders.slice(1).every(h => h === 'card')", label: 'the first link is pinned in its cell and its column lights; the others still wait on their cards'},
    {at: 0.45, fn: "s.pinned.every((p, i) => !p || s.pinned.slice(0, i).every(Boolean))", label: 'links are pinned in the supplied order (no pin lands before an earlier one)'},
    {at: 0.45, fn: "s.columnLit.every((v, i) => v === 0 || s.pinned[i])", label: 'a column lights only after its pin is pressed (cause precedes visible effect)'},
    {at: 1, fn: "s.pinned.every(Boolean) && s.pinAtCell.every(Boolean) && JSON.stringify(s.citedCells) === JSON.stringify(['0:0', '1:1', '1:2'])", label: 'final: exactly the supplied citations are pinned, each in its row × column cell'},
    {at: 1, fn: "s.linkCount === 3 && s.pinCells.every(c => c !== null)", label: 'no pin is added beyond the supplied citations'},
    {at: 1, fn: "JSON.stringify(s.pendingRows) === '[2]' && s.notesPlaced.every(Boolean) && s.noteCol.every(c => c === 'pending')", label: 'the row with no supplied source gets its note in the pending column'},
    {at: 1, fn: "s.columnLit.every(v => v === 1) && s.flags.every(v => v === 1) && !s.held && s.tagVisible", label: 'hold: columns lit, pinpoint flags open, hand empty, status tag shown'},
    {at: 1, params: {finalState: 'pending-called-out'}, fn: 's.calledOut === true', label: 'finalState pending-called-out rings the pending rows'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.pinned.some(Boolean) && !s.pinned.every(Boolean) && !s.tagVisible", label: 'actionProgress freezes the action part-way (no final tag)'},
    {at: 1, params: {citations: [{proposition: 0, source: 2, pinpoint: 'p. 9'}, {proposition: 2, source: 0, pinpoint: 'p. 2'}]}, fn: "JSON.stringify(s.citedCells) === JSON.stringify(['0:2', '2:0']) && JSON.stringify(s.pendingRows) === '[1]' && s.pinned.every(Boolean) && s.notesPlaced.every(Boolean)", label: 'the matrix follows the supplied citations (other cells, other pending row)'},
    {at: 1, params: {citations: [{proposition: 0, source: 0}, {proposition: 0, source: 0}, {proposition: 3, source: 0}]}, fn: 's.linkCount === 1', label: 'repeated or out-of-range citations are ignored'},
    {at: 1, fn: 's.textsWhole.query && s.textsWhole.note && s.geo.truncated.every(t => !t)', label: 'the query on the printout, the pending note and every proposition read whole'},
    {at: 1, params: {...P('long-labels-stress'), ...SQUARE}, fn: "s.geo.banded && s.geo.shelf && s.geo.library === 'narrow' && s.textsWhole.query && s.textsWhole.note && s.geo.truncated.every(t => !t)", label: 'square frame, long labels: a narrow bookcase stands beside the banded matrix, which keeps the query, the pending note and every proposition whole'},
    {at: 0.05, params: {...P('long-labels-stress'), ...SQUARE, textVisibility: 'none'}, fn: "s.geo.banded && s.geo.library === 'narrow'", label: 'square frame, long labels, labels hidden: the same composition (narrow bookcase + banded matrix)'},
    {at: 0.05, params: {...P('contrast-or-alternative'), ...SQUARE}, fn: "s.geo.shelf && s.geo.library === 'narrow' && s.geo.banded", label: 'square frame, alternative preset: the library stays in view (narrow bookcase) beside the banded matrix'},
    {at: 0.05, params: {...P('contrast-or-alternative'), ...SQUARE, textVisibility: 'none'}, fn: "s.geo.shelf && s.geo.library === 'narrow' && s.geo.banded", label: 'square frame, alternative preset, labels hidden: the same composition as with labels'},
    {at: 0.05, params: {...SQUARE}, fn: "s.geo.library === 'top' && !s.geo.banded", label: 'square frame, baseline: the wall shelf above the matrix'},
    {at: 0.05, params: {...SQUARE, textVisibility: 'none'}, fn: "s.geo.library === 'top' && !s.geo.banded", label: 'square frame, baseline, labels hidden: the same wall shelf composition'},
    {at: 1, params: {...P('contrast-or-alternative'), ...SQUARE}, fn: 's.textsWhole.query && s.textsWhole.note && s.geo.truncated.every(t => !t)', label: 'square frame, alternative preset: the short header still shows the whole query'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.pinned.every(Boolean) && s.notesPlaced.every(Boolean) && s.columnLit.every(v => v === 1)", label: 'labels hidden: the same physical transformation happens'},
  ],
});
