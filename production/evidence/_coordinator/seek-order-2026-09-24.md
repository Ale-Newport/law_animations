# Seek-order determinism fix (2026-09-24, coordinator)

A new harness check (`dom-seek-order`, tests/harness/in-page.js) and a survey of all 152 accepted items (`production/scratch/coord/seekorder.mjs`) found 5 items whose rendered DOM at time t depended on which time was shown before. The cause: frame records omitted an animated attribute at some times, so `applyFrame` kept a stale value. Affected: LAW-0034, LAW-0045, LAW-0047, LAW-0065, LAW-0067.

Fix (fixer agent, files: `src/animations/documents/LAW-0034.js`, `src/animations/research/kits/cita-localizada.js`, `src/animations/research/kits/extraccion-de-hechos.js`): the frame always emits the attribute, with the value a fresh render shows (the build() geometry or a neutral `translate(0 0)` / `opacity 1` on hidden elements).

Verification:
- seekorder.mjs on the 12 motif IDs (0033–0036, 0045–0048, 0065–0068): 0 of 12 differ (before: 5).
- All 12 tests pass; no `dom-seek-order` warnings.
- LAW-0045 and 0047 (and every sibling): render fingerprint unchanged, so the review carried forward automatically.
- LAW-0034, 0065 and 0067: the fingerprint changed only because neutral attributes were added to elements that are hidden at those keyframes. The coordinator checked:
  - (a) forward-ordered markup across all presets × 3 ratios × keyframes is identical once `transform="translate(0 0)"` and the shadow `opacity="1"` are removed (492/492 frames each);
  - (b) every evidence PNG (all contact sheets and the thumbnail) is byte-identical to the previously reviewed images (`production/scratch/seekorder-fix/evidence-before/`);
  - (c) the 16:9 baseline sheet of each item was viewed again.
  A coordinator delta review was recorded for these three.
