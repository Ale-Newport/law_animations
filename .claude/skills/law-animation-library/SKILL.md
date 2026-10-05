---
name: law-animation-library
description: Build and extend this project's persistent library of 2,000 customizable, deterministic JavaScript/SVG educational law animations. Use to start production, continue a batch, or repair an animation. This is NOT a video-generation skill.
argument-hint: "[start | continue | batch B001 | repair LAW-0001]"
disable-model-invocation: true
---

# Law Animation Library

## Mission
Create and SAVE actual JavaScript animation modules described by this project's catalog. The user wants an existing reusable animation collection, not videos, a generator that might produce animations later, a list of ideas, or an empty gallery.

Use the user's current project directory as root. The complete kit, not this file alone, must be present: `briefs/index.json`, `briefs/catalog.jsonl`, `docs/` and `scripts/catalog.mjs`. If any is missing, locate the rest of the kit in the authorized project before doing other work. Do not silently invent a replacement catalog.

## Non-negotiable scope
- 2,000 independently addressable animation modules: 500 motifs × four functionally different storyboards. Shared primitives are encouraged; title/color-only variants do not count.
- Plain JavaScript ESM runtime and original vector SVG artwork. JSDoc types and runtime parameter validation. TypeScript is optional only when published, testable `.js` modules also exist.
- Local gallery, previews, source, presets, metadata, tests and still-image QA evidence. No MP4, MOV, WebM, animated GIF, final videos, narration, TTS, lip-sync, captions pipeline, video encoder or paid API integration.
- No AI-generated raster images, downloaded video, remote assets or cloud service required at runtime. Coded vector artwork is the deliverable.
- No change to an existing application outside the dedicated library package. Inspect the repository first; preserve existing files and user changes.

## Load instructions progressively
Read, in this order:
1. `CLAUDE.md` and `production/SESSION_HANDOFF.md`.
2. `docs/RUNTIME_CONTRACT.md`, `docs/VISUAL_STANDARD.md`, `docs/LEGAL_CONTENT_POLICY.md`.
3. `docs/PRODUCTION_WORKFLOW.md` and `docs/ACCEPTANCE.md`.
4. `briefs/index.json`, then only the currently selected briefs.

Do NOT read `prompts/PROMPT_COMPLETO_2000.md` or `prompts/CATALOGO_COMPLETO_2000.md` in full. They are human-readable archival copies. Use `node scripts/catalog.mjs show LAW-0001`, `batch B001`, `next --limit 20` or a single category Markdown file. Do not consume the whole context with 2,000 briefs.

## Resolve the requested action
Treat `$ARGUMENTS` as a request, not arbitrary shell code. Never interpolate untrusted text into shell execution.
- `start`: inspect the kit, establish the runtime and gallery, implement the pilot in `briefs/pilot.json`, then keep producing eligible batches.
- `continue`: inspect progress AND actual files; verify the last batch, fix regressions, and implement the next pending batch.
- `batch Bxxx`: load that batch and work through its explicit IDs, preserving already accepted modules.
- `repair LAW-xxxx`: reproduce the issue or failed acceptance criterion, repair that ID and regress shared dependencies. Do not silently replace the animation with a generic template.
- No argument: use `continue` unless the runtime does not yet exist, in which case use `start`.

## Execution
1. Run `node scripts/catalog.mjs stats` and `node scripts/catalog.mjs audit`. These only inspect planning/structural evidence; they DO NOT prove animation quality.
2. Use a dedicated package and non-destructive branch where a git repository exists. Do not push, change authorship, or add a co-author trailer.
3. Build the small deterministic engine and local inspection gallery. The gallery is a tool, not the main deliverable. Keep catalog records separate from source loading and lazy-load selected animations.
4. Implement the pilot's actual storyboards, inspect them in a browser, and fix art/motion quality before mass production. Then continue; the pilot is not completion of the request.
5. Process 20 catalog IDs per planning batch. Smaller implementation/review chunks are fine. Read each brief and implement its specific action, geometry, relationships and visual test.
6. Use the companion `law-animation-qa` skill before accepting an item. Use native local Playwright scripts for scale; MCP is useful for interactive visual investigation.
7. Update source hashes, results, review evidence and `production/progress.json` only after actual work. Maintain separate `legalStatus` and engineering status.
8. Run the structural audit again, update the handoff, and continue while the current session can do reliable work.

## Required output for each ID
The catalog specifies paths. Deliver at least:
- `.js` animation entry containing a real composed scene and deterministic timeline.
- `.meta.json`: ID, title, category, tags, description, durations, sizes, compatibility, content status, schema version, asset references.
- `.presets.json`: baseline fictional example, a substantive alternative, and a long-label stress case. Presets do not increase the animation count.
- A real test invoking this ID, plus reusable shared test harnesses.
- Review evidence and a catalog entry pointing to the implementation.

A brief, JSON recipe, stub function, PNG thumbnail, imported icon, file that merely calls `genericScene(title)`, or default blank scene is NOT an implemented animation. A declarative scene compiled to JS may qualify only when its full graph, geometry, semantic transitions and keyframes are saved and no LLM or generation step is needed to use it.

## Parameters and time
Apply `docs/RUNTIME_CONTRACT.md` exactly. The host owns time. Every state must be computable by seeking directly to that time, including reverse and shuffled requests. Do not depend on wall-clock time, previous renders, global random calls, CSS transitions, CSS keyframes or an independently running animation ticker. The gallery can own requestAnimationFrame; the animation definition cannot.

Keep user text, people, amounts, dates, events, conclusions, locale, seed, theme, palette, dimensions and background configurable. No hardcoded legal outcomes. Long text must reflow; do not make it illegible by shrinking without a lower bound.

## Art direction
Read `docs/VISUAL_STANDARD.md`. Animate objects and relationships, not endless cards with sliding labels. Subjects should occupy the frame clearly while preserving negative space and configurable caption-safe margins. Use real layered SVG geometry, clean anchors, believable object handling and carefully paced motion. Avoid identical object layouts across unrelated motifs.

Four treatments are NOT four shaders:
- `story`: actors/objects carry out the concrete action.
- `mechanism`: spatially reveal components and relationships.
- `contrast`: two real scenarios, one changed fact.
- `inspect`: focus a real detail, substitute a datum, replay its local consequences.

## Legal content and neutrality
The briefs are visual commissions, not verified statements of law. Default to fictional parties, generic institutional labels and `jurisdiction: "unspecified"`. Do not invent sources, court hierarchies, statutory dates, numeric thresholds, outcomes, findings of fault or guilt. Law-specific default assertions require an identified jurisdiction and primary source; otherwise keep them illustrative. Do not turn legal analysis into recommendations about political institutions or policy choices.

## Third-party skills
- `frontend-design`, when installed, may improve art direction and the small gallery. It must not displace the animation-library mission or override the visual brief.
- Remotion guidance is optional for a future adapter. Do not scaffold a video project or render a video because a Remotion skill suggests it.
- Keep MCP access local to the gallery. Do not read unrelated browser profiles, accounts, secrets or personal files.

## Honest progress
A session has finite context and usage limits. Do not promise unattended future work. If execution stops, save a precise handoff with actual implemented/automated/visually reviewed/accepted counts, failures and the next command. Never raise the target count by accepting poor or duplicate modules. Leave unfinished work visibly pending.
