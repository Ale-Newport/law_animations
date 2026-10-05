// LAW-0020 — Ocultación de datos · inspect. Contract battery + ID-specific checks.
// Acceptance (brief): the detail keeps its source coordinates, the change is
// localised, and seeking back restores exactly the previous datum.
import {contractSuite, presetsFor} from '../harness/contract.js';

// safe areas that turn the 16:9 test frame into a square / portrait content box
const RATIOS = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}}};
const words = t => String(t).trim().split(/\s+/).join(' ');
const perPreset = presetsFor('LAW-0020').flatMap(pr => Object.entries(RATIOS).flatMap(([shape, sa]) => [
  // the changed-datum chip never crosses the resting marker, stamp, hands or actor chips (reviewer fix)
  {at: 1, params: {...pr.params, ...sa}, fn: 's.datumChipClear && s.datumChip !== null', label: `changed-datum chip clear of the resting props (${pr.name}, ${shape})`},
  {at: 1, params: {...pr.params, ...sa}, fn: `s.stampLines.join(' ') === ${JSON.stringify(words(pr.params.stampLabel || 'REDACTED COPY'))} && s.lensStampLines.join(' ') === s.stampLines.join(' ')`, label: `stamp impression never splits a word (${pr.name}, ${shape})`},
]));

contractSuite('LAW-0020', {
  semantic: [
    {at: 0, fn: 's.sourceContainsField && s.lensClearOfSource', label: 'lens source is the field region itself; the lens never covers it'},
    {at: 0.7, fn: 's.sourceCoversFieldBox', label: 'lens source spans the whole value box, so the band starts and ends inside the lens'},
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextBand === 0 && s.contextBands[0] === 1 && s.contextBands[1] === 1", label: 'context shows the before datum'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensBand === 0", label: 'lens open on the unchanged detail'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensBand > 0 && s.lensBand < 1 && s.contextBand === 0", label: 'substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextBand === 1 && s.contextDatum === 'after' && s.contextBands[3] === 0 && s.contextBands[4] === 0 && s.contextBands[0] === 1", label: 'returns to context with the new datum; other fields unchanged'},
    {at: 0.3, fn: "s.contextBand === 0 && s.datum === 'before' && s.lensBand === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'extent', redactions: [0, 1, 2], beforeValue: 'Whole value covered', afterValue: 'Last digits visible'}, fn: "s.contextBand === s.afterBand && s.afterBand > 0 && s.afterBand < 1 && s.beforeBand === 1", label: 'extent substitution: the band retracts to a partial cover'},
    {at: 0.1, params: {focusTarget: 'extent', redactions: [0, 1, 2]}, fn: 's.contextBand === 1', label: 'extent: before state is fully covered'},
    // lens opens/closes as an opaque card; the context field changes under the landing lens (reviewer fix)
    ...[0.1, 0.23, 0.3, 0.6, 0.8, 0.84, 0.845, 0.855, 0.86, 0.9, 1].map(at => ({at, fn: 's.lensWindow === 0 || s.lensWindow === 1', label: `lens window never half-transparent (${at})`})),
    {at: 0.84, fn: "s.lensOpen > 0 && s.lensWindow === 1 && s.contextBand === 0", label: 'context still shows the before datum while the lens returns'},
    {at: 0.845, fn: 's.lensOpen > 0 && s.lensWindow === 1 && s.contextBand > 0 && s.contextBand < 1', label: 'the context field updates under the landing lens'},
    {at: 0.8535, fn: 's.contextBand === 1', label: 'the context update is complete before the lens window disappears'},
    ...perPreset,
  ],
});
