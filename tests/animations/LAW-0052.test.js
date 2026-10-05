// LAW-0052 — Historial de una norma · inspect. Contract battery + ID-specific checks.
// Acceptance (brief): the detail keeps its source coordinates, the change is local,
// and seeking back to earlier times restores the previous datum exactly.
import {contractSuite} from '../harness/contract.js';

// every 60 fps frame of the return beat (8000 ms → 480 frames; 0.75 → 1): the detail is always covered by the
// opaque lens or by the context's own labels (fully wiped in) — the lens never blinks off before they are back
const returnFrames = Array.from({length: 121}, (_, k) => (360 + k) / 480).map(at => ({
  at,
  fn: 's.lensAlpha >= 0.999 || s.contextText >= 1',
  label: 'return: the lens or the context labels cover the detail',
}));

contractSuite('LAW-0052', {
  continuity: ['lensCard', 'contextCard', 'lensWindow'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.contextLayer === 1 && s.contextScale === 1", label: 'context shows the before datum at full size'},
    {at: 0.1, fn: "Math.abs(s.lensSourceInView.x - s.source.x - s.contextOrigin.x) < 0.01 && Math.abs(s.lensSourceInView.y - s.source.y - s.contextOrigin.y) < 0.01 && s.contextOrigin.y === 64", label: 'the lens source is the same region of the context (same coordinates)'},
    {at: 0.44, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensLayer === 1 && s.contextScale < 0.5", label: 'lens open on the unchanged detail; context kept as a thumbnail'},
    {at: 0.62, fn: "s.datum === 'changing' && s.contextDatum === 'before' && s.contextLayer === 1", label: 'the substitution happens inside the lens only'},
    {at: 0.72, fn: "s.datum === 'after' && s.lensLayer === 2 && s.lensCard.y > s.contextCard.y && s.contextDatum === 'before'", label: 'in the lens the card moved into the supplied layer; context unchanged'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.contextLayer === 2 && s.contextScale === 1 && Math.abs(s.contextCard.y - s.lensCard.y) < 0.01", label: 'returns to context with the new datum'},
    {at: 1, fn: "Math.abs(s.lensSourceInView.x - s.source.x - s.contextOrigin.x) < 0.01 && Math.abs(s.lensSourceInView.y - s.source.y - s.contextOrigin.y) < 0.01 && s.contextOrigin.y === 64", label: 'source coordinates unchanged after the return'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.datum === 'before' && s.contextLayer === 1", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'passage', beforeValue: 'The form is filed on paper or online.', afterValue: 'The form is filed on paper, online or by post.'}, fn: "s.contextDatum === 'after' && s.contextLayer === 1 && s.focusTarget === 'passage'", label: 'passage substitution leaves the card and the marked layer unchanged'},
    ...returnFrames,
  ],
});
