# Production workflow

## Phase 0 — inspect, do not overwrite
Read the kit and actual repository. This is a standalone library by default. Within an existing application, isolate it under an agreed package rather than rewriting the app. Preserve user edits and existing tooling. Create a local work branch only when this is compatible with the repository; no push or authorship changes.

Check installed Node/npm and Claude tool access. Choose mutually compatible stable dependency versions based on official documentation at implementation time, record them and keep the lockfile. Do not silently add services, credentials or paid infrastructure. Runtime animations must work locally/offline after normal installation; Claude Code itself is an external development tool and is not made offline by this architecture.

## Phase 1 — narrow foundation
Build a pure JS ESM SVG core, its contract tests and a minimal local gallery. Use Vite or an existing equivalent only for development. Implement a param form generated from schema, ID/category search, selected full-size preview, explicit time slider, pause/play/replay, frame stepping, aspect ratio/background controls and parameter/preset persistence. No video export buttons. Allow still SVG/PNG output only for inspection and thumbnails.

Separate catalog metadata from source. Show planned items as pending; do not label them ready. Use the manifest to lazy-load only the selected implementation. Support local string/tag search first; no vector database, embedding API or LLM search is necessary.

## Phase 2 — pilot as quality reference
Implement the 16 IDs in `briefs/pilot.json`: four motifs × four scenes spanning paper, interpersonal action, contractual communication and causal structure. Implement their actual objects and transformations. Inspect and fix them. Store a local golden reference with sources and QA evidence, not a screenshot of someone else's animation.

The pilot is a quality gate, not the final requested delivery. After the baseline is reliable, continue into the remaining batches without interpreting "pilot" as permission to stop at 16.

## Phase 3 — incremental production
There are 100 planning batches of 20 IDs in `briefs/batches/`. A batch comprises five motifs × four storyboards. Skip only IDs genuinely accepted in the pilot, not IDs merely listed. Load only the next batch's briefs.

For each motif: interpret concrete action → design its four storyboards → reuse/create appropriate vector geometry → implement modules → add three presets → test → inspect → fix → save evidence. Do not create 2,000 blank modules up front. Do not postpone all QA until after mass generation.

Use small implementation/review chunks as needed. Parallel workers, when available, may own disjoint category folders. Avoid concurrent edits to registry, core, asset manifest and progress; one coordinator merges those. Do not require special experimental agent-team features. A single Claude Code session can follow this workflow sequentially.

Every shared primitive change triggers dependent regression checks. Retain the source of all useful assets in the project. No dependencies on temporary folders, downloaded bundles outside the project or the original development machine.

## Phase 4 — inspectable persistent state
Update `production/progress.json` and `SESSION_HANDOFF.md` after a tested chunk. Record implemented vs accepted counts and unverified content status separately. Do not fabricate elapsed times or performance figures. Commands for planning:

```sh
node scripts/catalog.mjs stats
node scripts/catalog.mjs batch B001
node scripts/catalog.mjs show LAW-0441
node scripts/catalog.mjs next --limit 20
node scripts/catalog.mjs audit
```

These utilities are included in the kit and do not create animations. Implement project commands such as `npm run dev`, `npm test`, `npm run qa -- --batch B001`, `npm run build` and `npm run library:validate` during development; do not claim they exist before creating them.

## Phase 5 — package the actual library
At the target, validate all accepted IDs against executable modules, current evidence and full dependency hashes. Build an ESM package and independent-gallery build. Test importing selected modules into a separate minimal host project with no dev-server globals. Document installed dependencies, licences, API, parameter schemas, limitations and replacement of legal content. Still do not render any final videos.

If a session ends earlier, a valid outcome is a tested partial library plus an exact persistent queue. It is NOT valid to claim 2,000 ready animations when most are briefs or placeholders. Continue on the user's next invocation from actual files and handoff; never promise future unattended work.
