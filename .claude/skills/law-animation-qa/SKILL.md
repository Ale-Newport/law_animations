---
name: law-animation-qa
description: Audit actual JavaScript/SVG law-animation modules for deterministic time, visual quality, parameterization, distinct storyboards and honest completion evidence. Use before accepting library items or after shared engine changes.
argument-hint: "[LAW-0001 | batch B001 | changed]"
---

# Law Animation QA

You audit executable animations, not their briefs. Work only in this authorized library project. Read `docs/ACCEPTANCE.md`, `docs/RUNTIME_CONTRACT.md`, `docs/VISUAL_STANDARD.md` and the individual catalog brief. This skill does not generate videos.

## 1. Check that implementation exists
Inspect the actual entry, scene graph/timeline, dependencies, metadata, presets and tests. Check that the ID resolves to a functioning module and not a generic title-card alias. A JSON record or thumbnail is not an implementation.

## 2. Exercise the contract
Create at least two instances in one document. Await readiness. Seek directly to several moments, including reverse and shuffled time; repeat identical requests and compare normalized scene state or same-browser captures. Test parameter updates, resize, clipping, duplicate IDs, removal and cleanup. Test invalid parameters and escaped user content. Forbid network access outside the local host and check for runtime requests to third parties.

Frame numbers refer to the chosen external fps. In ordinary finite playback, frame n maps to n/fps seconds; state at exact duration is independently seekable. Do not hide a last-frame jump by assuming the last sampled frame equals the mathematical endpoint.

## 3. Inspect actual pictures
Launch the local gallery or use its running local URL. Make sure fonts/assets are ready before capturing. Capture the configured keyframes, view the captured images, inspect the actual timeline in browser for problematic motion, and write what was checked. Accessibility-tree inspection alone cannot validate SVG artwork.

Use Playwright MCP for directed investigation and local Playwright tests for batch runs. Screenshots existing on disk does not mean anyone inspected them. Do not set `visual_reviewed` unless a reviewer actually examined the images or live scene; record the reviewer, source hash, times and findings.

Inspect meaningful peaks, not just first/last frames. Look for cut-off labels, broken hands, detached props, overlapping paths, teleportation, small unreadable elements, invented causality and stock-title-card repetition. Review contrast scenes in both landscape and portrait.

## 4. Verify differentiation and content
Compare each motif's four treatments side by side. There must be four composed scenes with different spatial/narrative operations, not four names for the same animation. Shared assets and helpers are allowed. A perceptual similarity metric is only a flag; use human/vision review to decide.

Read legal labels in the preview. Fictional/illustrative examples may be engineering-accepted but must not become legally verified. Check neutral unresolved states and user-provided outcomes. Do not independently infer a verdict or a legal rule from a visual.

## 5. Record evidence
Create `production/evidence/<ID>/review.json` with source/dependency hash, browser, viewport, fps, times, preset, screenshot paths, commands, actual exit codes, issues and review method. Save only genuine results; never pre-fill "pass".

Use `planned → in_progress → implemented → automated_pass → visual_reviewed → accepted` only when each gate was actually met. `blocked` records an external or unresolved issue. Content review has a separate field. If shared runtime/art changed, invalidate affected results until rechecked.

## 6. Fix and re-test
Repair failures; do not remove tests, weaken criteria, replace a complex scene with a title card, or update image baselines without inspecting the change. Run shared regressions after changing a primitive. Mark blocked items explicitly and keep them out of accepted counts.

At the end, report exact counts and paths to evidence. `node scripts/catalog.mjs audit` is a structural cross-check, not a visual or legal certificate.
