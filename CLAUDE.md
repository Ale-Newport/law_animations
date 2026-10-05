# Law Animation Library — project instructions

The user wants 2,000 saved, customizable JavaScript/SVG animations for future educational law videos. DO NOT create any videos now. DO NOT stop at a generator, catalog, starter, or empty gallery.

This downloaded kit contains skills and 2,000 implementation briefs, NOT 2,000 finished animations. All IDs initially have `planned` status. Treat all output claims accordingly.

Use `/law-animation-library start` or read its SKILL.md. The exact briefs are in `briefs/catalog.jsonl`; load them selectively through `node scripts/catalog.mjs` rather than reading every brief into context. 500 motifs × four different compositions = 2,000 target animations. Presets, styles and formats do not increase this count.

Main deliverables: original local vector assets, JavaScript ESM modules with externally controlled deterministic time, editable parameters, searchable local gallery, tests, evidence and progress checkpoints. No required cloud runtime, LLM API, generated raster image, TTS, encoder, MP4/MOV/WebM/GIF, deployment, account integration or narration.

Preserve user files. Inspect before editing. Do not push or change git authorship; do not add a Co-authored-by trailer. No secrets or unrelated personal files. Bind preview servers to loopback by default.

Engineering acceptance and legal verification are separate. Default legal content to `illustrative-unverified`, fictional examples and `jurisdiction: unspecified`. No invented doctrine, citations, hierarchies, time limits or outcomes.

The companion QA skill must be applied before an item is accepted. A screenshot only counts as visual review when someone actually examined it. Keep a truthful `production/SESSION_HANDOFF.md` at every checkpoint.
