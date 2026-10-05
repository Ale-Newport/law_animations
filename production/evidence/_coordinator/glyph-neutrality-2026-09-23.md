# Glyph-neutrality fix — "Datum changed" marker (2026-09-23, coordinator)

An independent reviewer failed LAW-0136 because its "Datum changed" marker drew a white check mark (a tick reads as approved/valid; docs/AUTHORING.md → Legal content). The same tick pattern, which started in the pilot LAW-0004, was found in 16 accepted inspect scenes:
LAW-0004, 0008, 0012, 0016, 0020, 0024, 0032, 0036, 0040, 0044, 0052, 0056, 0060, 0064, 0444, 0684.

Change: in each entry module, the marker's tick path `M(x-k) y l a b l c -d` was replaced by a neutral Δ outline centred on the same point (`M x (y-k) l k 1.75k h -2k z`). Nothing else was edited.

Verification:
1. `markup.mjs` (this folder) dumped the exact SVG markup before and after: every preset (default, baseline, alternative, long-labels, es) × 16:9/9:16/1:1 × labels all/none × inspect keyframes (0.1…1). 3,402 frames in total.
2. Diff, after normalising only the marker path's `d` attribute: 0 other differences for every ID (every frame differs only in that path, since the marker node exists at opacity 0 early).
3. `qa.mjs` re-run for all 16: automated=pass, 0 capture errors.
4. The coordinator viewed each ID's 16:9 hold frame and a zoomed crop of each marker (`glyph-delta-crops.png`): all 16 show a white Δ in the accent circle, correctly centred, with no other visible change.

Not changed (judged neutral process marks, not status glyphs): the "extracted" row ticks in research/kits/extraccion-de-hechos.js (LAW-0065..0068), and the pen tick the clerk draws on the sticky index tab in documents/kits/cadena-de-versiones.js (LAW-0029..0032). Both are listed for the cleanup pass.
