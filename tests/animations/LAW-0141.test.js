// LAW-0141 — Ámbito territorial · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion (hands, slip, pawns, magnifier), anchoring of objects (the
// slip and each pawn ride the SOLVED hand while held, the magnifier too) and a transformation that
// stays recognizable with the labels hidden (slip on its zone, the sheet over that zone, pawns on the
// tiles supplied for them, solid / dashed rings).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {minTextPx, noOverlap, neutralZonePatternTest} from './ambito-territorial-checks.js';

// safe areas that turn the 16:9 test frame into the 1:1 / 9:16 content boxes (same content ratios)
const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0141').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
const every = (fn, label, at = 1) => variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape})`})));
const PLACED = "s.holders.every((h, i) => s.zones[i] < 0 ? h === 'dish' : h === 'board') && JSON.stringify(s.slotZones.filter((z, i) => s.zones[i] >= 0)) === JSON.stringify(s.zones.filter(z => z >= 0))";

contractSuite('LAW-0141', {
  continuity: ['slip', 'handL', 'handR', 't0', 't1', 't2', 'lupa'],
  attach: [
    // whenever the slip, a pawn or the magnifier is held, it sits exactly in the solved hand
    {from: 0, to: 1, a: 'handL', b: 'heldL', tol: 0.6},
    {from: 0, to: 1, a: 'handR', b: 'heldR', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: "s.slipHolder === 'book' && s.holders.every(h => h === 'dish') && s.spread === 0 && s.lupaHolder === 'rest' && s.rings.every(v => v === 0) && s.tags.every(v => v === 0)", label: 'rest: slip in the book, pawns in the dish, no sheet, no ring, magnifier at rest'},
    {at: 0.22, fn: "s.slipHolder === 'hand' && s.heldL && s.spread === 0", label: 'the slip travels in the hand before any sheet appears'},
    {at: 0.35, fn: "s.slipHolder === 'board' && s.spread > 0 && s.spread < 1", label: 'the sheet spreads from under the slip once it lies on its zone (cause precedes effect)'},
    {at: 0.36, fn: 's.rings.every(v => v === 0)', label: 'no ring before the sheet is fully down'},
    {at: 0.45, fn: "s.spread === 1 && s.holders.some(h => h === 'board') && s.holders.some(h => h !== 'board')", label: 'pawns are set one by one after the sheet is down'},
    {at: 0.64, fn: "s.lupaHolder === 'hand' && s.holders.every(h => h === 'board')", label: 'the magnifier is used only after every pawn is set'},
    {at: 1, fn: PLACED + " && s.slipOnZone === s.textZone && s.slipCoverage >= 0.8", label: 'final: every pawn stands on a tile of the zone supplied for it; the slip lies on its zone'},
    {at: 1, fn: "JSON.stringify(s.rels) === JSON.stringify(['shared','different','shared']) && s.rings.every(v => v === 1) && s.tags.every(v => v === 1)", label: 'final: rings follow the supplied placements (same zone / another zone), tags out'},
    {at: 1, fn: "s.lupaHolder === 'rest' && !s.heldL && !s.heldR && s.examined === 1", label: 'hold: magnifier back at rest after reading the pawn in another zone; hands empty'},
    {at: 1, params: {textVisibility: 'none'}, fn: PLACED + " && s.spread === 1 && s.rings.every(v => v === 1)", label: 'labels hidden: the same placement happens'},
    {at: 1, params: {finalState: 'text-placed'}, fn: "s.holders.every(h => h === 'dish') && s.spread === 1 && s.rings.every(v => v === 0) && s.lupaHolder === 'rest'", label: 'finalState text-placed: only the text is placed'},
    {at: 1, params: {finalState: 'placed'}, fn: PLACED + " && s.examined === null && s.lupaHolder === 'rest'", label: 'finalState placed: no magnifier step'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.holders.some(h => h !== 'board') && s.notesShown === 0", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {facts: [{label: 'A', zone: ' zone birch (FICTIONAL) '}, {label: 'B', zone: 'Zone Elm (fictional)'}]}, fn: "JSON.stringify(s.rels) === JSON.stringify(['different','off']) && s.holders[1] === 'dish' && s.holders[0] === 'board'", label: 'verbatim, case-insensitive match; a zone that matches no plaque is not placed on the board'},
    ...every(PLACED, 'all pawns placed in their supplied zones'),
    ...every('s.propsClear && s.allReached', 'slip, pawns, tags and plaques do not overlap; every target reached'),
    ...every('s.lupaParkedClear', 'the magnifier rests clear of cards, tags, plaques, books, dish and key'),
  ],
});

suppliedTextSuite('LAW-0141', {
  fields: 'return [...p.sources.map(x => x.title), ...p.sources.map(x => x.note), ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, p.passages[0].zone, ...p.zones.map(z => z.name), ...p.facts.map(f => f.label), ...p.facts.map(f => f.zone), p.actorLabels.a, p.objectLabels.dish, ...p.annotations.map(a => a.text), ...p.interpretations.map(x => x.text)];',
  content: 'return [...p.sources.map(x => x.title), ...p.sources.map(x => x.note), ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, p.passages[0].zone, ...p.zones.map(z => z.name), ...p.facts.map(f => f.label)];',
  captions: 'return [p.actorLabels.a, p.objectLabels.dish, ...p.annotations.map(a => a.text), ...(p.locale === "es" ? ["Según lo aportado · sin conclusión", "Hecho en otra zona"] : ["As supplied · no conclusion drawn", "Fact in another zone"])];',
});

// review fixes: the key never covers a zone plaque (baseline-es / stress 1:1), no visible text under
// 16 px at the hold (the reader chip wraps instead of shrinking), neutral zone patterns
ratioChecks('LAW-0141', 'hold: key clear of the zone plaques, all text >= 16 px', [
  {at: [0.9, 1], dom: noOverlap('[data-node$="-key"]', '[data-node*="-board-plaque"]'), label: 'the key card never covers a zone plaque'},
  {at: [1], dom: minTextPx(16), tv: ['all'], label: 'no visible text under 16 px at the hold'},
]);
neutralZonePatternTest('LAW-0141');
