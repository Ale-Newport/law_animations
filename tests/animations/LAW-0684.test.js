// LAW-0684 — Cadena causal · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is local,
// and seeking back restores the previous datum exactly.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0684', {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextStatus === 'proposed' && s.contextValue === 0", label: 'build: context shows the before datum'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensStatus === 'proposed'", label: 'isolate: lens open on the unchanged link'},
    {at: 0.4, fn: 's.sourceContainsContact', label: 'the lens source region contains the inspected contact point (same coordinates)'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensValue > 0 && s.lensValue < 1 && s.contextStatus === 'proposed'", label: 'substitute: the datum changes inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextValue === 1 && s.contextStatus === 'disputed' && s.contextDatum === 'after'", label: 'return: context shows the new datum'},
    {at: 1, fn: "s.tileAngles.every(a => a > 0) && s.lossState[0] === 'down' && s.otherJointsVisible === 3", label: 'the change is local: tiles, loss and other links untouched'},
    {at: 0.3, fn: "s.contextStatus === 'proposed' && s.datum === 'before' && s.lensValue === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'kind', beforeValue: 'Sequence', afterValue: 'Causal'}, fn: "s.contextKind === 'causal' && s.contextStatus === 'proposed' && s.focusTarget === 'kind'", label: 'kind substitution: sequence → causal, status untouched'},
    {at: 1, params: {focusLink: 3}, fn: 's.focusLink === 3 && s.sourceContainsContact', label: 'the inspected link is configurable (last link ends at the loss)'},
    {at: 1, params: {causalLinks: [{from: 1, status: 'disputed'}], beforeValue: 'Disputed', afterValue: 'Proposed'}, fn: "s.contextStatus === 'proposed'", label: 'reverse substitution: disputed → proposed'},
    {at: 1, fn: 's.markerClean', label: 'the changed-datum marker is placed clear of every tile (leader only crosses the two tiles of the inspected link)'},
    {at: 0.6, fn: 's.contextDim > 0.5 && s.lensOpen === 1', label: 'while the lens is open the context fades (no grey box drawn over it)'},
    {at: 0.6, params: {beforeValue: 'Proposed by Party A in the written account of the incident, as first supplied'}, fn: 's.beforeLines >= 2 && s.strikeLines === s.beforeLines && s.strikeOnLines', label: 'a wrapped old value is struck through line by line (one segment through each line, not between them)'},
    {at: 1, params: {focusTarget: 'kind', beforeValue: 'Sequence', afterValue: 'Causal'}, fn: 's.sourceContainsTab', label: 'kind: the arrow tab beside the seal lies inside the lens source region'},
    {at: 1, fn: 's.markerNoteGap === null || s.markerNoteGap >= 20', label: 'the changed marker stays visibly apart from the before → after note'},
    {at: 0.6, params: {events: [{label: 'Delivery crate left partly blocking the main customer aisle overnight'}, {label: 'Motorised floor-cleaning trolley makes contact with the delivery crate'}, {label: 'Freestanding shelf unit behind the crate is jolted sideways'}, {label: 'Ceramic display stand next to the shelf unit begins to wobble'}, {label: 'Glass display cover on the stand slides towards the edge'}, {label: 'Display cover falls against the pedestal holding the vase'}], focusLink: 2, beforeValue: 'Proposed by Party A in the written account', afterValue: 'Disputed by Party B, who puts forward an alternative intervening event'}, fn: 's.lensZoom >= 2.55', label: 'six long events (16:9): the lens uses free room to reach its full magnification'},
  ],
});
