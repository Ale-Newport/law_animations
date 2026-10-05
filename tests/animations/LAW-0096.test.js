// LAW-0096 — Regla y excepción · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the glass is a real
// copy of the board enlarged about the holder), the change is local (only the
// datum and its supplied dependent state change) and seeking back restores the
// previous datum exactly.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0096', {
  continuity: ['lensC', 'recordAt'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.marker === 'present' && s.link.before === 1 && s.link.after === 0", label: 'build: the context shows the before datum and the supplied relation marker → socket'},
    {at: 0.05, fn: 's.link.before > 0 && s.blade === 0 && s.pulse === 0', label: 'build: the relation is drawn before the switch moves (cause before effect)'},
    {at: 0.19, fn: "s.blade === 1 && s.gate === 1 && s.litBranch === 1 && s.litMain === 0 && s.routeShown === 'branch'", label: 'build: the supplied before state (separate branch open) is complete'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.sourceContainsHolder && s.sourceContainsMarker && s.holderInLens === true", label: 'isolate: the lens source contains the holder and the marker slot, and the glass maps them at the same relative coordinates'},
    {at: 0.4, fn: 's.lensZoom >= 1.8', label: 'the detail is genuinely enlarged'},
    {at: 0.48, fn: 's.strike > 0 && s.tapeSlide === 0 && s.blade === 1 && s.marker === "present"', label: 'the old value is struck through before anything moves'},
    {at: 0.55, fn: "s.datum === 'changing' && s.tapeOffset === s.lensTapeOffset && s.marker === 'present' && s.link.before === 1 && s.blade === 1", label: 'substitute: the tape slides (same datum in the glass and the context); nothing dependent has changed yet'},
    {at: 0.6, fn: 's.contextDim > 0.3 && s.lensOpen === 1', label: 'while the glass is up the context fades (no overlay box)'},
    {at: 0.74, fn: "s.datum === 'after' && s.marker === 'absent' && s.link.before === 0 && s.socket.before === 0 && s.pulse === 0 && s.blade === 0 && s.gate === 0 && s.litMain === 1 && s.litBranch === 0 && s.lensOpen === 1", label: 'only the supplied dependent state follows: marker, relation, socket, wire, switch and lit route'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDim === 0 && s.datum === 'after' && s.flagShown && s.flagAtHolder && s.tagShown === 'after' && s.recordLift > 0", label: 'return: context restored, changed-datum pennant pinned to the holder, record kept'},
    {at: 1, fn: 's.flagClear && s.recordClearOfLens', label: 'the pennant stays clear of plaques and socket; the record never sits under the glass'},
    {at: 0.82, fn: 's.lensVisible === 0 && s.lensOpen > 0', label: 'return: the glass has dissolved before it shrinks near 1:1 over its source (no doubled text)'},
    {at: 0.4, fn: 's.lensVisible === 1', label: 'isolate: the glass is fully visible while the detail is examined'},
    {at: 0.3, fn: "s.datum === 'before' && s.tapeSlide === 0 && s.strike === 0 && s.marker === 'present' && s.blade === 1 && s.link.before === 1", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'condition', beforeValue: 'The parcel needs a signature', afterValue: 'The parcel is marked fragile', routeAfter: 'held-pending'}, fn: "s.focusTarget === 'condition' && s.sourceContainsHolder && s.sourceContainsMarker && s.marker === 'pending' && s.link.before === 0 && s.blade === 0 && s.litMain === 0 && s.litBranch === 0", label: 'condition target: the holder on the condition plaque (with the socket) is inspected; pending leaves the route unset'},
    {at: 1, params: {routeBefore: 'main-as-supplied', routeAfter: 'branch-as-supplied', beforeValue: 'No signature needed', afterValue: 'Needs a signature'}, fn: "s.marker === 'present' && s.link.after === 1 && s.blade === 1 && s.litBranch === 1 && s.litMain === 0", label: 'reverse substitution: the supplied branch opens after the change'},
    {at: 1, params: {routeAfter: 'held-disputed'}, fn: "s.marker === 'disputed' && s.link.kindAfter === 'disputed' && s.link.after === 1 && s.blade === 0 && s.litMain === 0 && s.litBranch === 0", label: 'disputed after state: dashed relation, no route lit, no outcome'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.marker === 'absent' && s.blade === 0 && s.flagShown", label: 'labels hidden: the same substitution and dependent change happen'},
  ],
});
