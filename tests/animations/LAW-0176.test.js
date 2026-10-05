// LAW-0176 — Intervención de perito · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens starts exactly on its source,
// which follows the context while it shrinks to a thumbnail), the change is localised (one datum,
// then only its dependent scope zone / dimension lines) and seeking back restores the old datum.
// Windows (LAW-0176.js): build 0–0.2 · lens opens 0.21–0.33 (context → thumbnail) · old value out
// 0.46–0.52 · slip 0.52–0.56 · new value in 0.56–0.61 · zone out 0.62–0.66 / in 0.67–0.71 ·
// lens closes 0.75–0.82 (context grows back) · context old out 0.755–0.78, new in 0.785–0.815 ·
// Δ marker and card 0.83–0.88 · held from 0.88.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0176').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}) @${at}`,
}))));
const MEAS = {focusTarget: 'measurement', beforeValue: 'Outer diameter: 42 mm (hypothetical)', afterValue: 'Outer diameter: 44 mm (hypothetical)'};

contractSuite('LAW-0176', {
  continuity: ['lensC'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.tagHolder === 'pinned' && s.figure > 0 && s.camScale === 1", label: 'build: the linked state (tag pinned, report filling); full-size context'},
    {at: 0.2, fn: "s.lensOpen === 0 && s.zoneNow === 'before' && s.zones.outer === 1 && !s.markerVisible", label: 'build complete: the stated scope zone is outlined (before)'},
    {at: 0.225, fn: 's.lensOpen > 0 && s.lensOpen < 0.05 && Math.abs(s.lensRect.w - s.source.w * s.camScale) < 0.05 * s.source.w', label: 'isolate: the lens lifts off its own source (same coordinates) as it opens'},
    ...[0.24, 0.27, 0.3].map(at => ({at, fn: 's.lensOpen > 0 && s.lensOpen < 1 && s.camScale < 1 && s.camScale > s.thumbScale', label: `isolate: the context shrinks WHILE the lens opens (never a thumbnail on a blank frame) @${at}`})),
    {at: 0.4, fn: "s.lensOpen === 1 && s.contextThumb && s.datum === 'before' && s.lensScaleOnPage >= 2.2", label: 'isolate: a real enlargement (≥ 2.2× the thumbnail), nothing changed yet'},
    {at: 0.5, fn: "s.datum === 'changing' && s.newInLens === 0 && s.oldInLens < 1", label: 'substitute: the old value leaves first'},
    {at: 0.555, fn: 's.oldInLens === 0 && s.newInLens === 0 && s.slip > 0.5', label: 'substitute: old and new are never drawn together; the old value is kept as a struck slip'},
    {at: 0.615, fn: "s.datum === 'after' && s.contextDatum === 'before' && s.zoneNow === 'before'", label: 'substitute: datum first, dependent geometry after; the context page is untouched'},
    {at: 0.72, fn: "s.zoneNow === 'after' && s.zones.outer === 0 && s.zones.whole === 1 && s.contextDatum === 'before'", label: 'only the dependent scope zone is redrawn (outer → whole, as supplied)'},
    ...[0.77, 0.79].map(at => ({at, fn: 's.lensOpen > 0 && s.lensOpen < 1 && s.camScale > s.thumbScale && s.camScale < 1', label: `return: the context grows back while the lens closes @${at}`})),
    {at: 0.9, fn: "s.lensOpen === 0 && s.camScale === 1 && s.contextDatum === 'after' && s.markerVisible", label: 'changed state fully settled before the hold (from 0.88)'},
    {at: 1, fn: "s.contextDatum === 'after' && s.markerVisible && s.zoneNow === 'after' && s.allReached && s.lensAtSource", label: 'return: full context, new value, Δ marker and struck old value'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.zoneNow === 'before' && s.lensValue === 'Scope: teeth of item 7, surface only'", label: 'seeking back restores exactly the old datum and zone'},
    {at: 0.72, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.zoneNow === 'after' && s.contextThumb", label: 'labels hidden: the same substitution and zone change'},
    {at: 1, params: {detailGeometry: {zoom: 2.4, placement: 'auto', row: 0, zoneBefore: 'inner', zoneAfter: 'inner'}}, fn: "s.zoneNow === 'same' && s.zones.inner === 1", label: 'same zone supplied before and after: no geometry changes (nothing inferred from the text)'},
    {at: 0.645, params: MEAS, fn: "s.focus === 'measurement' && s.zoneNow === 'same' && s.dim < 1", label: 'measurement focus: the dimension lines are re-traced'},
    {at: 1, params: MEAS, fn: "s.contextDatum === 'after' && s.dim === 1 && s.markerVisible", label: 'measurement focus: new value in context, dimension lines back, Δ marker'},
    {at: 0.3, params: MEAS, fn: "s.contextDatum === 'before' && s.lensValue === 'Outer diameter: 42 mm (hypothetical)'", label: 'measurement focus: seeking back restores the old value'},
    ...each([1], 's.chipsFit && s.cardFit && s.cardClear && s.allReached', 'labels and the changed-datum card placed uncut and clear of each other'),
  ],
});

suppliedTextSuite('LAW-0176', {
  fields: "const R = p.props.report; const m = p.focusTarget === 'measurement'; const i = Math.round(p.detailGeometry.row || 0); return [p.actors[0].name, p.roles.specialist, p.props.object, p.props.tag, R.title, R.figure, R.dataHeading, ...R.measurements.filter((x, j) => !m || j !== i), R.opinionHeading, R.opinion, m ? R.scope : null, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  content: "const R = p.props.report; const m = p.focusTarget === 'measurement'; const i = Math.round(p.detailGeometry.row || 0); return [p.props.tag, R.title, R.figure, R.dataHeading, ...R.measurements.filter((x, j) => !m || j !== i), R.opinionHeading, R.opinion, p.beforeValue, p.afterValue];",
  captions: 'return [p.contextLabels.context, p.contextLabels.marker];',
});

ratioChecks('LAW-0176', 'review round 1: card next to its datum, attached name chip, steady dim, resting hands', [
  // the struck old value lives on the page right under its datum, tied by a short leader
  {at: [1], tv: ['all'], fn: 's.cardFit && s.cardLeader && s.cardOnPage && s.cardGap <= s.S * 8', label: 'changed-datum card on the page next to its datum with a leader'},
  // labels hidden: the card is text, so only the neutral Δ marker stays on the datum
  {at: [1], tv: ['none'], fn: 's.markerVisible', label: 'labels hidden: the Δ marker stays on the changed datum'},
  {at: [1], fn: 's.nameLeader', label: 'name chip attached to the specialist by a leader'},
  {at: [0, 0.5, 1], fn: 's.handsOnBench', label: 'hands rest on the bench (rest pose)'},
  // the context thumbnail keeps one dim level while the lens is open (no flicker)
  {at: times(0.34, 0.74, 0.02), fn: 's.dimOpacity === 0.38', label: 'steady dim while the lens is open'},
  // review round 1 (standing rule): no supplied text is drawn over its placeholder dashes mid-transition
  {at: times(0.0, 1.0, 0.005), dom: `[...svg.querySelectorAll('[data-node]')].filter(e => /-ph-(row\\d+|op)$|^d-ph\\d+$|^op-ph$/.test(e.dataset.node)).every(ph => { const n = ph.dataset.node; const tn = n.replace('-ph-row', '-row').replace(/-ph-op$/, '-op').replace(/^d-ph/, 'd-row').replace(/^op-ph$/, 'op-text'); const t = svg.querySelector('[data-node="' + tn + '"]'); const o = e => Number(e.getAttribute('opacity') ?? 1); return !t || o(ph) === 0 || o(t) === 0; })`, label: 'placeholder leaves before its text arrives', presets: ['baseline-illustrative', 'long-labels-stress'], tv: ['all']},
]);
