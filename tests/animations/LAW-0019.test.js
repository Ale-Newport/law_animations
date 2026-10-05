// LAW-0019 — Ocultación de datos · contrast. Contract battery + ID-specific checks.
// Acceptance (brief): both scenes exist, exactly the indicated fact changes,
// and no legal consequence is invented to complete the contrast.
import {contractSuite, presetsFor} from '../harness/contract.js';

const SAME_OUTSIDE = 's.a.bands.every((v, i) => s.selected.includes(i) || v === s.b.bands[i])';
// safe areas that turn the 16:9 test frame into a square / portrait content box
const RATIOS = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}}};
const words = t => String(t).trim().split(/\s+/).join(' ');
const perPreset = presetsFor('LAW-0019').flatMap(pr => [
  // stacked scenes: the guide passes B's header strip right of the header text (reviewer fix)
  {at: 1, params: {...pr.params, ...RATIOS.portrait}, fn: "s.arrangement === 'column' && s.guideHeaderGap > 0", label: `stacked guide stays clear of the scenario header text (${pr.name})`},
  ...Object.entries(RATIOS).map(([shape, sa]) => ({at: 1, params: {...pr.params, ...sa}, fn: `s.stampLines.join(' ') === ${JSON.stringify(words(pr.params.stampLabel || 'COPY'))}`, label: `stamp impression never splits a word (${pr.name}, ${shape})`})),
]);

contractSuite('LAW-0019', {
  continuity: ['markerA', 'markerB', 'handA1', 'handB1', 'stampA', 'stampB'],
  attach: [{from: 0.21, to: 0.45, a: 'nibB', b: 'bandEdgeB', tol: 1.5}],
  semantic: [
    {at: 0.1, fn: 'JSON.stringify(s.a) === JSON.stringify(s.b)', label: 'identical base situation in both scenes'},
    {at: 0.3, fn: "s.a.bands.every(b => b === 0) && s.b.bands.some(b => b > 0) && s.a.marker === 'desk' && s.b.marker === 'A'", label: 'only scenario B picks up the marker and starts covering'},
    {at: 0.6, fn: `s.a.bands.every(b => b === 0) && s.selected.every(i => s.b.bands[i] === 1) && ${SAME_OUTSIDE} && s.a.labels === s.b.labels`, label: 'only the selected fields differ; layout identical'},
    {at: 0.65, fn: 's.a.stamp === s.b.stamp', label: 'the shared stamp runs in parallel'},
    {at: 1, fn: `s.a.stamp && s.b.stamp && s.a.marker === 'desk' && s.b.marker === 'desk' && JSON.stringify(s.b.bands) === JSON.stringify([1,1,1,0,0]) && ${SAME_OUTSIDE}`, label: 'both copies stamped identically; only the bands differ'},
    {at: 1, fn: 's.guideProgress === 1 && s.focusField === 0', label: 'comparison guide drawn at the end on the changed field'},
    {at: 1, params: {scenarioBMode: 'outline'}, fn: "s.b.bands.every(b => b === 0) && s.selected.every(i => s.b.marks[i] === 1) && s.a.marks.every(m => m === 0) && s.modeB === 'outline'", label: 'alternative: B outlines the fields instead of covering them'},
    // footer notes share one spot: one fades out before the next fades in (reviewer fix: no garbled cross-fade)
    ...[0.3, 0.5, 0.515, 0.525, 0.55, 0.7, 0.85, 0.87, 0.885, 0.9, 0.95, 1].map(at => ({at, fn: 's.footerNotesVisible <= 1', label: `at most one footer note visible (${at})`})),
    ...perPreset,
  ],
});
