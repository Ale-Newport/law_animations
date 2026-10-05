// LAW-0132 — Conflicto entre textos · inspect. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: the enlarged detail keeps its source
// coordinates, the change is localized, and seeking back restores the old datum.
import {contractSuite, presetsFor} from '../harness/contract.js';

// safe areas that turn the 16:9 test frame into a square / portrait content box
const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}}};
const all = [...presetsFor('LAW-0132'), {name: 'labels-hidden', params: {textVisibility: 'none'}}];
const perPreset = all.flatMap(pr => Object.entries(SHAPES).flatMap(([shape, sa]) => [
  // isolate: the desk shrinks as ONE opaque group; its words give way to bars only at thumbnail size
  ...[0.25, 0.29, 0.31, 0.33].map(at => ({at, params: {...pr.params, ...sa}, fn: 's.shrink > 0.72 || s.contextOpacity === 1', label: `desk stays opaque while it shrinks (${pr.name}, ${shape}, t=${at})`})),
  // hold: both state tags hang from the seam marker; the changed-datum leader ends outside the Δ badge and crosses no wording
  {at: 1, params: {...pr.params, ...sa}, fn: 's.tagsAtSeam && s.markDotClear && s.markLeadClear', label: `state tags attached to the seam; changed-datum leader clear of badge and wording (${pr.name}, ${shape})`},
  // B007 round 2: the note keeps off the pin cup; its leader never runs on the ribbon or along the
  // gutter fold; the Δ badge sits on the phrase's outer side, clear of the seam marker
  {at: 1, params: {...pr.params, ...sa}, fn: 's.markClearOfCup && s.markLeadOffGutter && s.badgeClear', label: `changed-datum note clear of the cup, leader off ribbon and gutter, Δ badge unobstructed (${pr.name}, ${shape})`},
  // the round lens never shows a word cut at its rim: the heading is whole inside it or left out
  ...[0.45, 0.6, 0.72].map(at => ({at, params: {...pr.params, ...sa}, fn: 's.lensHeadingWhole', label: `lens copy has no cut heading (${pr.name}, ${shape}, t=${at})`})),
]));

contractSuite('LAW-0132', {
  continuity: ['lens', 'sourceOnStage'],
  // The lens shows a real magnified copy drawn over the scene: its text copies
  // (marked with a zero-width space) intentionally overprint the originals.
  allowTextOverlap: ['​'],
  semantic: [
    {at: 0.19, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.datum === 'announced orally' && s.highlight === 1", label: 'build: the state produced by the action is shown before any zoom'},
    {at: 0.3, fn: "s.lensMapsSource && s.lensOpen > 0 && s.contextScale < 1", label: 'isolate: the lens is a copy anchored on the source point of the context'},
    {at: 0.44, fn: "s.lensOpen === 1 && s.magnification > 1.5 && s.lensMapsSource && s.datum === 'announced orally' && s.stateShown === 'conflict-flagged'", label: 'the detail is enlarged before anything is substituted'},
    {at: 0.7, fn: "s.datum === 'announced orally or in writing' && s.swap === 1 && s.lensOpen === 1", label: 'substitute: only the focused datum changes, inside the lens'},
    {at: 0.4, fn: "s.datum === 'announced orally' && s.swap === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.markerShown && s.stateShown === 'reading-proposed' && s.datum === 'announced orally or in writing'", label: 'return: full context, changed-datum marker, supplied after-state'},
    {at: 1, params: {states: {before: 'conflict-flagged', after: 'conflict-flagged'}}, fn: "s.stateShown === 'conflict-flagged' && s.datum === 'announced orally or in writing'", label: 'the state is never inferred from the new wording (supplied equal states stay equal)'},
    {at: 0.5, params: {focusTarget: 'tension-a', beforeValue: 'in writing', afterValue: 'in writing or by e-mail'}, fn: "s.focusTarget === 'tension-a' && s.lensMapsSource && s.lensOpen === 1", label: 'the book phrase can be inspected with the same guarantees'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.markerShown === true || s.markerShown === false", label: 'renders with labels hidden'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.swap === 1 && s.lensOpen === 1", label: 'the substitution plays with labels hidden'},
    ...perPreset,
  ],
});
