# Production workflows (Claude Code `Workflow` scripts)

These scripts orchestrate parallel builder / reviewer agents. They are a
development aid for continuing the library; the animation library itself does
not depend on them.

| Script | Purpose | Args |
|---|---|---|
| `production-batch.js` | build → independent review → fix → final review (records reviews) for new motifs | `{portBase, references, motifs:[{key, category, motif, slug, ids, action, comparison, objects}]}` — generate `motifs` with `node scripts/batch-motifs.mjs B00x` |
| `repair-from-file.js` | fix → final review for motifs whose review findings are stored in a JSON file | `{portBase, findingsFile, motifs:[{key, category, motif, slug, ids}]}` |

Operational notes learned in session 1:
- One builder per motif (4 IDs). ~10 motifs per run is the practical maximum; runs of 10 motifs used ~14M subagent tokens and a usage limit interrupted the fix stage.
- Resuming a run replays cached agents only for the longest unchanged prefix of `agent()` calls. With `pipeline()` the call order depends on completion order, so a resume can re-run finished reviews. When a run dies after reviews completed, extract the recorded findings from the run journal into `production/review-findings/<name>.json` and use `repair-from-file.js` instead of resuming.
- Use distinct `portBase` values for concurrent runs (each motif uses `portBase + index` for its Playwright server).
- Final reviewers record reviews with `scripts/review.mjs`; only `node scripts/accept.mjs --all` (coordinator) turns evidence into statuses in `production/progress.json`.
