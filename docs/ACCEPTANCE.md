# Acceptance gates and evidence

## The count
The target is 2,000 implemented, separately addressable animations. The 6,000 minimum presets, four themes and three aspect ratios do not raise that count. Fifty category pages, 2,000 briefs, generated filenames, a JSON recipe catalog, placeholders, icon assets and PNG thumbnails count as zero finished animations on their own.

A source entry may rely on shared tested primitives. It qualifies only when it contains/resolves a saved, complete scene graph, concrete geometry, timing and semantic transitions for its brief. Loading it with parameters must play it without another LLM call or code-generation step. A general animation engine without the materialized entries is incomplete.

## Gate A — structure and source
For each ID: check entry, metadata, presets, real tests, local dependencies and registry resolution. Check stable IDs/version/schema, transitive asset licences and no remote imports. Reject placeholders or the same generic scene under 2,000 filenames. `catalog.mjs audit` checks basic filesystem evidence only; supplement it with real import, contract and browser tests.

## Gate B — automated behavior
For every ID, at least:
- Mount, readiness, seek, setParams, resize, getState and idempotent destroy.
- Determinism at normalized times 0, .1, .25, .5, .75, .9 and 1, in ordered, reverse and shuffled order. Compare serialized numeric state with a declared tolerance and same-browser rendered results where appropriate.
- 16:9, 9:16 and 1:1 layouts; transparent background and one neutral background.
- Baseline, substantive alternative and long-label presets. Exercise the full preset×ratio matrix for layout/contract checks; keep captures only for the meaningful review cases to avoid huge unnecessary artifacts.
- Different seeds; two simultaneous instances; changed params without preset mutation; disposal/remount; invalid dimensions/duration/fps/params. Check pre-ready time behavior and frame mapping at 24, 30 and 60 fps.
- No console errors, missing local assets, duplicate SVG IDs, invalid/NaN transforms, unsafe text injection, illegal element bounds outside an intentional clip, network requests to external domains or growing leftover DOM/listeners.

Text can be inside a parent shape without being a collision. Overlap assertions must distinguish intended containment from accidental occlusion. Numeric bounding boxes alone cannot prove visual quality.

## Gate C — actual visual inspection
For each ID, save and actually inspect a five-keyframe contact sheet from meaningful times, including its main action and final state. For comparisons, check both portrait and landscape. Examine the pilot and new/changed motion primitives in live playback; inspect full playback for any item flagged by contacts, continuity tests or visual reviewers. Stills alone cannot certify natural motion.

Record exactly what was reviewed: contact sheet, live playback, frame sequence, viewport, theme and preset. Do not claim review of all themes if only one was tested. If no visual-capable review occurred, leave `visual_reviewed` false even if screenshots exist. Static inspection should be labelled honestly and not described as a full motion review.

Check for semantic action, readability, clean layering, anchored lines, limb/prop attachment, smooth object handoff, legitimate before/after, unclipped safe areas and distinct geometry across the motif's four treatments. A screenshot hash or similarity metric can flag duplicates but cannot make the final artistic judgement.

## Gate D — content and documentation
Ensure preset content is clearly illustrative or has appropriate provenance. No unsupported legal/political conclusions. Confirm field descriptions, examples, limitations, compatible themes and known issues. Engineering accepted does not imply content legally verified.

## Evidence format
Each ID's `production/evidence/<ID>/review.json` should store:

```json
{
  "animationId": "LAW-0001",
  "sourceHash": "actual sha256 of implementation plus relevant dependencies",
  "commands": [],
  "automatedChecks": {"status": "not_run"},
  "visualReview": {"status": "not_reviewed", "reviewer": null, "method": null, "artifacts": [], "findings": []},
  "legalStatus": "illustrative-unverified",
  "testedConfigurations": [],
  "knownIssues": [],
  "accepted": false
}
```

Do not copy the example and change status to pass without running checks. Store actual commands, exit codes and tests. Browser, dependency, renderer and font versions should accompany pixel-based tests. Store visual artifacts under the ID directory and reference relative paths. Include dependencies in the effective source hash; an unchanged entry can regress when a shared character rig changes.

## Performance
Measure import time, seek time, scene node count and memory for representative complexity classes on the recorded environment. Use those measurements to set defensible project budgets; do not fabricate universal 60-fps or render-time claims. Do not mount 2,000 animated previews at once. Test repeated gallery selection and cleanup. Report the machine/browser used when claiming a result.

## Lifecycle
Engineering statuses: `planned`, `in_progress`, `implemented`, `automated_pass`, `visual_reviewed`, `accepted`, `blocked`. Store content review separately. Any failed gate excludes an item from accepted count. Re-run affected checks after shared changes and invalidate stale evidence. At interruption, save state and exact next IDs; do not say the whole target is complete because the catalog exists.
