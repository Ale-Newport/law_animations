// LAW-0153 — Interpretaciones concurrentes · story. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: continuous motion, props anchored to the solved
// hands, and a transformation (one passage → two separated, labelled readings) that
// reads with labels hidden.
import {contractSuite} from '../harness/contract.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

contractSuite('LAW-0153', {
  continuity: ['handA', 'handB', 'filmA', 'filmB', 'gripA', 'gripB'],
  attach: [
    // each overlay rides its reader's hand (by its pull tab) from the grab until the hand lets go
    {from: 0.196, to: 0.668, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0.196, to: 0.668, a: 'handB', b: 'gripB', tol: 1.5},
  ],
  // the overlays' traced copies (marked with a zero-width space) intentionally overprint the passage
  allowTextOverlap: ['​'],
  semantic: [
    {at: 0, fn: "s.holderA === 'tray' && s.holderB === 'tray' && s.lit === 0 && s.trace === 0 && s.band === 0", label: 'rest: both overlays blank in their trays, table unlit'},
    {at: 0.19, fn: "s.switchOn && s.lit > 0.9 && s.trace === 0", label: 'reader A flips the switch before the table lights (cause precedes effect)'},
    {at: 0.3, fn: "s.holderA === 'hand' && s.holderB === 'hand' && s.trace === 0 && s.band === 0", label: 'both hands slide their overlays onto the passage before anything is traced'},
    {at: 0.4, fn: "s.registered && s.stacked && s.trace > 0 && s.band === 0", label: 'both overlays register on the one passage and are traced'},
    {at: 0.5, fn: "s.registered && s.stacked && s.band > 0 && s.bandsDiffer && s.focusFound[0] && s.focusFound[1]", label: 'each overlay gets its own highlight pattern over the same passage'},
    {at: 0.6, fn: "s.holderA === 'hand' && s.holderB === 'hand' && !s.stacked", label: 'the hands slide the overlays apart'},
    {at: 1, fn: "s.separated && s.cardsShown && s.cardsEqual && s.stateShown && s.keyShown && s.finalState === 'separated'", label: 'hold: two separated readings, equal attributed cards, supplied state and neutral key'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.separated && s.bandsDiffer', label: 'the transformation completes identically with labels hidden'},
    {at: 1, params: {finalState: 'traced'}, fn: "s.stacked && s.band === 1 && s.holderA === 'table' && s.holderB === 'table' && s.equalWeight && s.stripes[0] === 'top' && s.stripes[1] === 'bottom' && s.bandVisible[0] === 1 && s.bandVisible[1] === 1", label: 'supplied "traced": both patterns held on the one passage, interleaved so both stay equally visible'},
    {at: 1, params: {finalState: 'placed'}, fn: "s.stacked && s.trace === 0 && s.band === 0", label: 'supplied "placed": overlays laid on the passage, nothing traced'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && !s.separated", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sources: [{id: 'T1', title: 'Text 1 (fictional)', level: 1}, {id: 'CA', title: 'Commentary A (fictional)', level: 0}, {id: 'CB', title: 'Commentary B (fictional)', level: 0}]}, fn: "s.separated && s.cardsEqual", label: 'reordering the supplied hierarchy changes nothing about the readings (displayed, not applied)'},
  ],
});

// every preset × real ratio × labels shown/hidden: the layout fits, objects never overlap, the parked
// magnifier and every note keep clear of the objects, and annotation leaders cross no object
ratioChecks('LAW-0153', 'layout fits; notes and leaders clear; arms off the board; equal weight; the table leads the action', [
  {at: [0, 1], fn: 's.fits && s.noObjOverlap && s.notesClear && s.leadersClear', label: 'layout fits and every note / leader is clear'},
  {at: [0.3, 0.5, 1], fn: 's.allReached', label: 'every hand target reachable'},
  // review B (1:1): no arm may lie across the hierarchy board at any time
  {at: [0.02, 0.06, 0.1, 0.14, 0.18, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76], fn: 's.armsOffBoard', label: 'the drawn arms never lie across the hierarchy board'},
  // equal weight (legal): A and B overlays, bands, cards and trays get identical treatment (opacity, stroke, size)
  {at: [0.5, 1], fn: 's.equalWeight && s.stripes[0] !== s.stripes[1] && s.bandVisible[0] === 1 && s.bandVisible[1] === 1', label: 'A and B receive identical visual treatment; their bands are interleaved stripes, never one over the other'},
  // review B (1:1, 9:16): while the overlays are traced the light table fills the frame; the emptied trays leave it
  {at: [0.42, 0.45, 0.48], ratios: ['1:1', '9:16'], fn: 's.camZoom > 1.35 && s.tableFrac >= 0.85', label: 'the view pushes in on the table during tracing'},
  {at: [0.42, 0.45, 0.48], ratios: ['9:16'], fn: 's.trayOut === 1', label: '9:16: the emptied trays are out of view during tracing'},
  {at: [0.56, 0.6, 1], fn: 's.camZoom === 1 && s.trayOut === 0', label: 'the full desk is back before the overlays are slid into the trays'},
]);

suppliedTextSuite('LAW-0153', {
  fields: `const src = i => p.sources[Math.min(p.sources.length - 1, p.interpretations[i].source)].title;
    return [p.passages.ref, p.passages.text, ...p.interpretations.flatMap(x => [x.label, x.text, x.focus]), src(0), src(1),
      p.sources[0].title, ...p.sources.map(s => s.id), ...p.hierarchy.levels, p.hierarchy.caption,
      p.actorLabels.a, p.actorLabels.b, p.objectLabels.table, ...p.annotations.map(a => a.text)]`,
  captions: `return p.locale === 'es' ? ['Propuesta (según lo aportado)', 'Jerarquía editable'] : ['Proposed (as supplied)', 'Editable hierarchy']`,
});
