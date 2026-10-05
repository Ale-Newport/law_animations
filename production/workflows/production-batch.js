export const meta = {
  name: 'production-batch',
  description: 'Implement, independently review, fix and final-review the motifs of one or more catalog batches',
  phases: [
    {title: 'Build', detail: 'one builder per motif (4 IDs)'},
    {title: 'Review', detail: 'independent visual/QA reviewer per motif'},
    {title: 'Fix', detail: 'builder repairs findings'},
    {title: 'Final review', detail: 'second independent review; records genuine reviews'},
  ],
}

// args: {motifs: [{key, category, motif, ids:[4], action, comparison:{a,b}, objects:[], slug}], portBase}
const ROOT = '/Users/alejandro/Projects/law-animation-kit'
const MOTIFS = args.motifs
const PORT_BASE = args.portBase || 5300

const COMMON = `
You are working in the project at ${ROOT} (JavaScript ESM + SVG animation library for educational law videos; the animation modules ARE the product — no videos).
READ FIRST: docs/AUTHORING.md, docs/VISUAL_STANDARD.md, docs/LEGAL_CONTENT_POLICY.md, docs/RUNTIME_CONTRACT.md. Study the accepted reference motifs before designing: ${args.references || 'src/animations/documents/ (LAW-0001..0004 + kits/signing-desk.js) with presets and tests'}. Read the shared building blocks you will use: src/primitives/*.js, src/frameworks/*.js, src/schemas/fields.js, src/core/define.js.
Load briefs with: node scripts/catalog.mjs show LAW-xxxx (never read prompts/*COMPLETO* or the whole catalog).
HARD RULES:
- Do NOT edit src/core/, src/primitives/, src/frameworks/, src/schemas/, tests/harness/, scripts/, docs/, briefs/, gallery/, production/progress.json, production/SESSION_HANDOFF.md, or any other motif's files. Other agents work in parallel. Create your own motif kit as src/animations/<category>/kits/<your-motif-slug>.js (you may import existing kits read-only). Put shared-change wishes in coreChangeRequests.
- Only create/modify: your 4 entry modules + presets, your kit file(s), tests/animations/<your IDs>.test.js, production/scratch/<your-key>/. Temporary files go ONLY under production/scratch/<your-key>/ (never /tmp or a shared scratchpad — parallel agents overwrite those).
- Never mark anything accepted; never edit progress.json. No videos/GIFs.
- Concurrency: ALWAYS prefix test/qa commands with your env (unique LAW_TEST_PORT and PW_OUT given below). Run "node scripts/build-registry.mjs" after adding modules (other agents also run it; if an import of src/registry.js fails transiently, re-run).
- Legal content: fictional names, jurisdiction unspecified, illustrative-unverified, descriptive states only; never invent rules, time limits, thresholds, percentages, outcomes, verdicts, guilt, winners, rankings or citations; allegations stay allegations; public-institution topics stay neutral processes. Hypothetical amounts are labelled hypothetical.
- Quality bar (the visual output is the product): match the accepted reference motifs. Large, legible, layered original vector artwork with objects and actors that physically perform the brief's concrete action; props follow SOLVED hand positions; hand-offs at a shared point; no teleports; readable held final state; genuine layout adaptation for 16:9 / 9:16 / 1:1 (ctx.view.shape); all text inside the design space; with textVisibility 'none' no <text> is visible and the action still reads. The four treatments must be genuinely different compositions/timelines (story / mechanism / contrast / inspect per docs/AUTHORING.md), not re-titled copies. Avoid generic "three rounded cards + arrows" — design each motif's own objects and spatial logic. Reuse primitives (desk, paper, person rig, badges, lens, paired, graph) where they fit, but do not force a desk or a person into a scene that needs a different object.
- LOOK at your renders: node scripts/shot.mjs --id <ID> --ratio <r> --times ... --out production/scratch/<key>/x.png and open PNGs with the Read tool. Iterate until clean.
- Read the section "Defects independent reviewers keep finding" in docs/AUTHORING.md and design against it from the start (label collisions, truncated meaning, fake portrait/square re-layout, garbled cross-fades, connectors that don't land, elbow flips, clipping by windows, detached tags, states shown too early, tiny key labels).
- production/evidence/<ID>/automated.json has non-blocking "warnings" (text-overlap, low-frame-coverage). Treat each as a defect to fix; only intentional overprints (e.g. a stamp over a title) may be allow-listed in the test via allowTextOverlap: ['WORD'] with a comment.
`

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    ids: {type: 'array', items: {type: 'string'}},
    filesCreated: {type: 'array', items: {type: 'string'}},
    testsPassing: {type: 'array', items: {type: 'string'}},
    testsFailing: {type: 'array', items: {type: 'string'}},
    imagesViewed: {type: 'array', items: {type: 'string'}},
    selfReview: {type: 'string'},
    knownIssues: {type: 'array', items: {type: 'string'}},
    coreChangeRequests: {type: 'array', items: {type: 'string'}},
  },
  required: ['ids', 'filesCreated', 'testsPassing', 'testsFailing', 'imagesViewed', 'selfReview', 'knownIssues', 'coreChangeRequests'],
}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    perId: {type: 'array', items: {type: 'object', properties: {
      id: {type: 'string'},
      verdict: {type: 'string', enum: ['pass', 'fail']},
      imagesViewed: {type: 'array', items: {type: 'string'}},
      defects: {type: 'array', items: {type: 'string'}},
      strengths: {type: 'array', items: {type: 'string'}},
      reviewRecorded: {type: 'boolean'},
    }, required: ['id', 'verdict', 'imagesViewed', 'defects', 'strengths', 'reviewRecorded']}},
    distinctTreatments: {type: 'boolean'},
    summary: {type: 'string'},
  },
  required: ['perId', 'distinctTreatments', 'summary'],
}

const envOf = i => `LAW_TEST_PORT=${PORT_BASE + i} PW_OUT=production/test-output/${MOTIFS[i].key}`

function buildPrompt(m, i) {
  return `${COMMON}
ASSIGNMENT: implement motif "${m.motif}" (category ${m.category}) — IDs ${m.ids.join(', ')} (story, mechanism, contrast, inspect in catalog order; confirm with the briefs).
Concrete action: ${m.action}. Comparison: A "${m.comparison.a}" vs B "${m.comparison.b}". Brief objects: ${m.objects.join(', ')}.
Your key: ${m.key}; kit file: src/animations/${m.category}/kits/${m.slug}.js; env prefix: ${envOf(i)}.
For EACH ID deliver the entry module at the catalog output path, presets (baseline-illustrative, contrast-or-alternative with a substantive change, long-labels-stress, baseline-es), and tests/animations/<ID>.test.js with contractSuite + semantic assertions encoding the brief's acceptanceCheck (continuity tracks for moving objects, attach windows for held props, allReached when IK is used). Use the category's customizableFields from the briefs (build a field set in your kit if src/schemas/fields.js lacks one).
Workflow: read the four briefs → write a short storyboard comment atop each module → build the kit → implement → build-registry → run each test (with env) until green → capture and LOOK at 16:9, 9:16, 1:1, long-labels and labels-hidden renders → fix → finally ${envOf(i)} node scripts/qa.mjs --ids ${m.ids.join(',')} and look at production/evidence/<ID>/ sheets.
Return the structured report; list every remaining defect honestly.`
}
function reviewPrompt(m, i, report, final) {
  return `${COMMON}
ROLE: independent QA reviewer (apply .claude/skills/law-animation-qa/SKILL.md). You did NOT build these. Motif "${m.motif}" (${m.category}): ${m.ids.join(', ')}. Do not edit source files.
Builder report (verify, do not trust): ${JSON.stringify(report).slice(0, 3500)}
1. Run ${envOf(i)} node scripts/qa.mjs --ids ${m.ids.join(',')} and note automatedChecks.status in each production/evidence/<ID>/review.json and the "warnings" in each automated.json (inspect every warned case visually).
2. Open EVERY contact sheet in production/evidence/<ID>/ with Read. Capture and view dense frame strips around each main action (node scripts/shot.mjs --id <ID> --times <10 close times> --cols 5 --cell 300 --out production/scratch/${m.key}/rev-<ID>.png) and a labels-hidden sheet (--params '{"textVisibility":"none"}').
3. Per ID check: the brief's concrete action is physically shown; composition distinct from the other three; hands/props attached, no teleports; clean layering; legible text inside the frame not covering actors; real re-layout in portrait/square; readable final hold; labels-hidden still reads; neutral legal content. Flag clones.
4. 'pass' only at the quality of the accepted reference motifs; else 'fail' with concrete, actionable defects (ID, ratio, time, element, fix).
${final ? `5. FINAL REVIEW: for each ID you pass whose automatedChecks.status is 'pass', run: node scripts/review.mjs --id <ID> --status pass --reviewer "claude subagent (independent reviewer, workflow production-batch)" --method "contact sheets (16:9, 9:16, 1:1, alternative, long-labels, es) and dense frame strips viewed as images; no real-time playback" --artifacts <sheet file names you viewed> --findings "<observations separated by |>" --content-ok . For failed IDs run it with --status fail and the defects as findings. Set reviewRecorded.` : 'Do NOT run scripts/review.mjs in this round (reviewRecorded=false).'}
Return the structured review.`
}
function fixPrompt(m, i, review) {
  return `${COMMON}
ASSIGNMENT: repair motif "${m.motif}" (${m.category}): ${m.ids.join(', ')} — files already exist (kit src/animations/${m.category}/kits/${m.slug}.js). Env prefix: ${envOf(i)}.
Reviewer findings to fix (all actionable ones, also on IDs marked pass): ${JSON.stringify(review).slice(0, 6000)}
Fix, re-run each test, LOOK at the affected renders again, then run ${envOf(i)} node scripts/qa.mjs --ids ${m.ids.join(',')}. Return the structured report.`
}

phase('Build')
const results = await pipeline(
  MOTIFS.map((m, i) => ({m, i})),
  ({m, i}) => agent(buildPrompt(m, i), {label: `build:${m.key}`, phase: 'Build', schema: BUILD_SCHEMA}),
  (build, {m, i}) => agent(reviewPrompt(m, i, build, false), {label: `review:${m.key}`, phase: 'Review', schema: REVIEW_SCHEMA}).then(review => ({build, review})),
  (x, {m, i}) => agent(fixPrompt(m, i, x.review), {label: `fix:${m.key}`, phase: 'Fix', schema: BUILD_SCHEMA}).then(fix => ({...x, fix})),
  (x, {m, i}) => agent(reviewPrompt(m, i, x.fix, true), {label: `final:${m.key}`, phase: 'Final review', schema: REVIEW_SCHEMA}).then(final => ({key: m.key, ids: m.ids, build: x.build, review: x.review, fix: x.fix, final})),
)
return {results: results.map(r => r && {key: r.key, ids: r.ids, final: r.final, knownIssues: r.fix && r.fix.knownIssues, coreChangeRequests: [...((r.build && r.build.coreChangeRequests) || []), ...((r.fix && r.fix.coreChangeRequests) || [])]})}
