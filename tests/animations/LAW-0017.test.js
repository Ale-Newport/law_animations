// LAW-0017 — Ocultación de datos · story. Contract battery + ID-specific checks.
// Acceptance (brief): continuity of motion, object anchoring, and the
// transformation must be recognisable with labels hidden.
import {contractSuite, presetsFor} from '../harness/contract.js';

const COVERED = 'JSON.stringify(s.bands) === JSON.stringify([1,1,1,0,0])';
// safe areas that turn the 16:9 test frame into a square / portrait content box
const RATIOS = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}}};
const words = t => String(t).trim().split(/\s+/).join(' ');
// every preset × content shape: leader dots clear of their label/value box and
// the copy-type impression printed as whole words (kit copyStampMark)
const perPreset = presetsFor('LAW-0017').flatMap(pr => Object.entries(RATIOS).flatMap(([shape, sa]) => {
  const stamp = (pr.params.objectLabels && pr.params.objectLabels.stamp) || 'REDACTED COPY';
  return [
    {at: 1, params: {...pr.params, ...sa}, fn: 's.leadersClear', label: `leader dots end clear of the label and value box (${pr.name}, ${shape})`},
    {at: 1, params: {...pr.params, ...sa}, fn: `!s.stampLines || s.stampLines.join(' ') === ${JSON.stringify(words(stamp))}`, label: `stamp impression never splits a word (${pr.name}, ${shape})`},
  ];
}));

contractSuite('LAW-0017', {
  continuity: ['markerTip', 'handA', 'handB', 'stampTool'],
  attach: [
    // the marker is positioned from A's solved hand whenever it is held
    {from: 0, to: 1, a: 'handA', b: 'heldGrip', tol: 1.5},
    // while pressing, each band's growing edge is exactly the nib
    {from: 0.14, to: 0.6, a: 'nib', b: 'bandEdge', tol: 1.5},
    // the stamp touches the copy-type box only while pressed
    {from: 0.585, to: 0.79, a: 'stampAt', b: 'stampContact', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.markerAtRest && s.bands.every(b => b === 0) && !s.stampApplied && s.labelsKept === 5", label: 'starts with the full record, marker resting on the desk'},
    {at: 0.1, fn: "s.markerAtRest && !s.markerHeld", label: 'marker stays on the desk until the hand reaches its grip'},
    {at: 0.14, fn: "s.markerAtRest && !s.markerHeld && !s.reaching && s.beat === 'rest'", label: 'the rest beat (0–0.15) stays still: marker on the desk, hand not yet reaching'},
    {at: 0.29, fn: 's.markerTouching && s.activeField === 0 && s.bands[0] > 0 && s.bands[0] < 1 && s.bands[1] === 0', label: 'first band grows under the pressing nib'},
    {at: 0.45, fn: 's.bands[0] === 1 && s.bands[1] === 1 && s.bands[2] === 0 && s.labelsKept === 5', label: 'bands are laid field by field; labels stay'},
    {at: 0.72, fn: `s.markerAtRest && ${COVERED} && JSON.stringify(s.valuesRemoved) === JSON.stringify([0,1,2])`, label: 'marker laid back at its rest spot after the bands; covered values removed'},
    {at: 1, fn: `${COVERED} && s.stampApplied && s.beat === 'hold' && s.labelsKept === 5`, label: 'held final state: selected fields covered, structure kept, copy-type stamped'},
    {at: 1, params: {textVisibility: 'none'}, fn: `${COVERED} && s.stampApplied && s.markerAtRest`, label: 'labels hidden: the same physical transformation happens'},
    {at: 1, params: {finalState: 'marked'}, fn: "JSON.stringify(s.marks) === JSON.stringify([1,1,1,0,0]) && s.bands.every(b => b === 0) && !s.stampApplied", label: 'marked state: outlines only, values stay, no stamp'},
    {at: 1, params: {finalState: 'unredacted'}, fn: "s.bands.every(b => b === 0) && s.markerAtRest && !s.stampApplied", label: 'unredacted state: no band, marker never picked up'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.bands[0] === 1 && s.bands[2] < 1 && !s.stampApplied && s.actionCapped', label: 'actionProgress freezes the action part-way'},
    // a narrow stamp shrinks a long single word instead of breaking it
    {at: 1, params: {objectLabels: {folder: 'Copies for release', stamp: 'DISCLOSURE COPY'}, ...RATIOS.portrait}, fn: "JSON.stringify(s.stampLines.join(' ').split(' ')) === JSON.stringify(['DISCLOSURE', 'COPY'])", label: 'DISCLOSURE COPY prints as whole words on the portrait desk'},
    ...perPreset,
  ],
});
