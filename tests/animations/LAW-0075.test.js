// LAW-0075 — Matriz de autoridades · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes, and no legal
// consequence is invented to complete the contrast.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/research/LAW-0075.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;
// caption-safe margins that make a 1920×1080 frame's content box square-shaped (tall side-by-side panels)
const SQUARE = {safeArea: {top: 0.06, bottom: 0.2, left: 0.25, right: 0.25}};

contractSuite('LAW-0075', {
  continuity: ['aPin0', 'aPin1', 'aPin2', 'bPin0', 'bPin1', 'bPin2', 'sheetA', 'noteB'],
  semantic: [
    {at: 0.1, fn: "s.sameLayout && JSON.stringify(s.a.holders) === JSON.stringify(s.b.holders) && s.a.holders.every(h => h === 'card') && !s.a.sheetShown && s.b.pendingNote === 0", label: 'base: two identical complete scenes (same geometry, every pin on its card, no difference shown yet)'},
    {at: 0.1, fn: 'JSON.stringify(s.aPin1) === JSON.stringify(s.bPin1) && JSON.stringify(s.aPin0) === JSON.stringify(s.bPin0)', label: 'base: pins sit at identical panel positions'},
    {at: 0.28, fn: "s.b.pendingNote > 0 && !s.b.noteOnSlot && s.a.holders.every(h => h === 'card')", label: 'B: the pending note is being carried up from the pad on the ledge (it does not pop up on the slot)'},
    {at: 0.37, fn: "s.a.sheetSupplied && s.b.pendingNote === 1 && s.a.holders.every(h => h === 'card') && s.b.holders.every(h => h === 'card')", label: 'change beat: A receives the source sheet, B gets the pending note — before any pin moves'},
    {at: 0.6, fn: 's.a.holders.every((h, k) => s.changedLinks.includes(k) || h === s.b.holders[k])', label: 'parallel: every unchanged link runs identically in both scenes'},
    {at: 1, fn: "s.a.holders.every(h => h === 'cell') && s.changedLinks.every(k => s.b.holders[k] === 'card') && s.b.holders.every((h, k) => s.changedLinks.includes(k) || h === 'cell')", label: 'final: only the links that need the changed source differ (A in the cell, B still on the card)'},
    {at: 1, fn: 'JSON.stringify(s.changedLinks) === "[1]" && s.changedCol === 1 && s.b.sockets.every(v => v === 1)', label: 'the changed fact is the supplied changedSource; B marks its cell with an empty socket only'},
    {at: 1, fn: 's.b.columnLit.every((v, k) => (s.changedLinks.includes(k) ? v === 0 : v === 1)) && s.a.columnLit.every(v => v === 1)', label: 'no consequence invented: B keeps the other links and draws nothing in the pending column'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 1, params: {changedSource: 0}, fn: "JSON.stringify(s.changedLinks) === '[0,2]' && s.b.holders[0] === 'card' && s.b.holders[2] === 'card' && s.b.holders[1] === 'cell'", label: 'the changed column follows the supplied data (two rows cite S1)'},
    {at: 1, fn: 's.textsWhole && s.b.noteWhole', label: 'every proposition and source title shows whole, and B\'s pending note reads whole'},
    {at: 1, params: {...P('contrast-or-alternative'), ...SQUARE}, fn: 's.textsWhole && s.b.noteWhole && JSON.stringify(s.changedLinks) === "[0,2]"', label: 'square panels, alternative preset: the changed source\'s title and B\'s pending note are never cut'},
    {at: 1, params: {...P('long-labels-stress'), ...SQUARE}, fn: 's.textsWhole && s.b.noteWhole', label: 'square panels, long labels: propositions, titles and the pending note stay whole'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.a.sheetSupplied && s.changedLinks.every(k => s.a.holders[k] === 'cell' && s.b.holders[k] === 'card')", label: 'labels hidden: the same difference is visible'},
  ],
});
