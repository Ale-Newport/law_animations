# Rules for builder / reviewer agents (session 2)

Project root: /home/user/law_animations (JavaScript ESM + SVG animation library for educational law videos; the animation modules ARE the product — no videos).

## Environment (cloud container)
- ALWAYS export `PLAYWRIGHT_BROWSERS_PATH=/home/user/pw-browsers` before any Playwright command (tests, `scripts/qa.mjs`, `scripts/shot.mjs`). Do NOT run `playwright install`.
- Prefix test/qa commands with your own env: `LAW_TEST_PORT=<your port> PW_OUT=production/test-output/<your key>`.
- The machine has 4 CPUs shared by several agents: run one test file at a time (`npx playwright test tests/animations/LAW-xxxx.test.js --workers=1`), never the full suite.

## Read first
docs/AUTHORING.md (incl. "Defects independent reviewers keep finding"), docs/VISUAL_STANDARD.md, docs/LEGAL_CONTENT_POLICY.md, docs/RUNTIME_CONTRACT.md. Study accepted reference motifs before designing (each category folder in src/animations/ has accepted kits, presets and tests; e.g. src/animations/documents/ LAW-0001..0004 + kits/signing-desk.js). Read the shared building blocks you use: src/primitives/*.js, src/frameworks/*.js, src/schemas/fields.js, src/core/define.js.
Load briefs with `node scripts/catalog.mjs show LAW-xxxx` (never read prompts/*COMPLETO* or the whole catalog).

## Hard rules
- Do NOT edit src/core/, src/primitives/, src/frameworks/, src/schemas/, tests/harness/, scripts/, docs/, briefs/, gallery/, production/progress.json, production/SESSION_HANDOFF.md, or any other motif's files. Other agents work in parallel. Your motif kit is src/animations/<category>/kits/<slug>.js (you may import existing kits read-only). Put shared-change wishes in your report under coreChangeRequests.
- Only create/modify: your 4 entry modules + presets (+ generated .meta.json), your kit file(s), tests/animations/<your IDs>.test.js, production/scratch/<your key>/. Temporary files ONLY under production/scratch/<your key>/.
- Never mark anything accepted; never edit progress.json; never run `scripts/accept.mjs`. No videos/GIFs. No git commits (the coordinator commits).
- Run `node scripts/build-registry.mjs` after adding modules (others run it too; if an import of src/registry.js fails transiently, re-run).
- Legal content: fictional names, jurisdiction unspecified, `illustrative-unverified`, descriptive states only; never invent rules, time limits, thresholds, percentages, outcomes, verdicts, guilt, winners, rankings or citations; allegations stay allegations; public-institution topics stay neutral processes; hypothetical amounts labelled hypothetical. Never use check marks / green-red as legal verdict colours.
- Quality bar: match the accepted reference motifs. Large, legible, layered original vector artwork with objects/actors that physically perform the brief's concrete action; props follow solved hand positions; hand-offs at a shared point; no teleports; readable held final state; genuine layout adaptation for 16:9 / 9:16 / 1:1 (ctx.view.shape); all text inside the design space; with textVisibility 'none' no <text> is visible and the action still reads. The four treatments (story / mechanism / contrast / inspect, see docs/AUTHORING.md) must be genuinely different compositions/timelines. Avoid generic "three rounded cards + arrows". Reuse primitives (desk, paper, person rig, badges, markers.changedMarker, lens, paired, graph) where they fit.
- Keep cold create() under ~1 s even for the long-labels stress preset at 1:1 (bound or cache layout searches).
- No debug hooks (globalThis.__dbg etc.) in delivered modules.
- LOOK at your renders: `node scripts/shot.mjs --id <ID> --ratio <r> --times ... --out production/scratch/<key>/x.png`, open PNGs with the Read tool. Iterate until clean.
- production/evidence/<ID>/automated.json has non-blocking "warnings"; treat each as a defect to fix; only intentional overprints may be allow-listed in the test with a comment.

## Builder deliverables (per ID)
Entry module at the catalog output path with a storyboard comment, presets (baseline-illustrative, contrast-or-alternative with a substantive change, long-labels-stress, baseline-es), tests/animations/<ID>.test.js with contractSuite + semantic assertions encoding the brief's acceptanceCheck (continuity tracks for moving objects, attach windows for held props, allReached when IK is used). Use the category's customizableFields from the briefs. Finish with `node scripts/qa.mjs --ids <your 4 IDs>` (with env) and look at production/evidence/<ID>/ sheets. Report honestly: files created, tests passing/failing, images viewed, remaining defects, coreChangeRequests.

## Reviewer procedure (apply .claude/skills/law-animation-qa/SKILL.md)
You did NOT build these; do not edit source files.
1. Run `node scripts/qa.mjs --ids <IDs>` (with env); note automatedChecks.status in each production/evidence/<ID>/review.json and the warnings in each automated.json (inspect every warned case visually).
2. Open EVERY contact sheet in production/evidence/<ID>/ with Read. Capture and view dense frame strips around each main action (`node scripts/shot.mjs --id <ID> --times <10 close times> --cols 5 --cell 300 --out production/scratch/<key>/rev-<ID>.png`) and a labels-hidden sheet (`--params '{"textVisibility":"none"}'`).
3. Per ID check: the brief's concrete action is physically shown; composition distinct from the other three; hands/props attached, no teleports; clean layering; legible text inside the frame not covering actors; real re-layout in portrait/square; readable final hold; labels-hidden still reads; neutral legal content. Flag clones.
4. 'pass' only at the quality of the accepted reference motifs; else 'fail' with concrete, actionable defects (ID, ratio, time, element, fix).
5. When told this is a FINAL review: for each ID you pass whose automatedChecks.status is 'pass', run `node scripts/review.mjs --id <ID> --status pass --reviewer "claude subagent (independent reviewer, session 2)" --method "contact sheets (16:9, 9:16, 1:1, alternative, long-labels, es) and dense frame strips viewed as images; no real-time playback" --artifacts <sheet file names you viewed> --findings "<observations separated by |>" --content-ok`. For failed IDs run it with `--status fail` and the defects as findings. Report per ID: verdict, images viewed, defects, reviewRecorded.
