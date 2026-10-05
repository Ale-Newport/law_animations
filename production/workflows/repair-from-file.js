export const meta = {
  name: 'repair-from-file',
  description: 'Fix review findings stored in a project JSON file for each motif, then run an independent final review that records genuine reviews',
  phases: [{title: 'Fix'}, {title: 'Final review'}],
}

// args: {portBase, findingsFile: 'production/review-findings/X.json', motifs: [{key, category, motif, slug, ids}]}
const ROOT = '/Users/alejandro/Projects/law-animation-kit'
const MOTIFS = args.motifs
const PORT_BASE = args.portBase || 5400
const FILE = args.findingsFile

const COMMON = `
You are working in the project at ${ROOT} (JavaScript ESM + SVG animation library for educational law videos; the animation modules ARE the product).
Read docs/AUTHORING.md (especially "Defects independent reviewers keep finding"), docs/VISUAL_STANDARD.md, docs/LEGAL_CONTENT_POLICY.md. Accepted reference quality: the IDs that node scripts/accept.mjs reports as accepted (e.g. src/animations/documents/LAW-0001..0020, roles LAW-0185..0187, contract-formation LAW-0441..0443, causation LAW-0681..0683).
HARD RULES: do NOT edit src/core/, src/primitives/, src/frameworks/, src/schemas/, tests/harness/, scripts/, docs/, gallery/, production/progress.json, production/SESSION_HANDOFF.md, production/review-findings/, or other motifs' files. Only edit the motif's own entry modules, presets, kit files and tests. Put temporary files ONLY under production/scratch/<your-motif-key>/ (never in /tmp or a shared scratchpad; other agents overwrite those). Prefix every test/qa command with the env given. Never mark anything accepted. Legal content stays fictional, neutral and illustrative-unverified. LOOK at renders (node scripts/shot.mjs ... then open the PNG with Read).
`
const envOf = i => `LAW_TEST_PORT=${PORT_BASE + i} PW_OUT=production/test-output/repair-${MOTIFS[i].key}`

const FIX_SCHEMA = {type: 'object', properties: {ids: {type: 'array', items: {type: 'string'}}, fixed: {type: 'array', items: {type: 'string'}}, remaining: {type: 'array', items: {type: 'string'}}, imagesViewed: {type: 'array', items: {type: 'string'}}}, required: ['ids', 'fixed', 'remaining', 'imagesViewed']}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    perId: {type: 'array', items: {type: 'object', properties: {id: {type: 'string'}, verdict: {type: 'string', enum: ['pass', 'fail']}, imagesViewed: {type: 'array', items: {type: 'string'}}, defects: {type: 'array', items: {type: 'string'}}, reviewRecorded: {type: 'boolean'}}, required: ['id', 'verdict', 'imagesViewed', 'defects', 'reviewRecorded']}},
    summary: {type: 'string'},
  },
  required: ['perId', 'summary'],
}

phase('Fix')
const out = await pipeline(
  MOTIFS.map((m, i) => ({m, i})),
  ({m, i}) => agent(`${COMMON}
ASSIGNMENT: repair motif "${m.motif}" (${m.category}) — IDs ${m.ids.join(', ')}; its kit(s) are in src/animations/${m.category}/kits/ (${m.slug}*). Env prefix: ${envOf(i)}.
An independent reviewer examined the renders and recorded findings. Read them from ${FILE}: in that JSON, motifs[] has an entry with key "${m.key}"; its "defects" object maps each ID to a list (the first item states the verdict). Fix every FAIL item and every minor item that is cheap. A previous fixer may have started and been interrupted, so inspect the current files before editing.
Then re-run each ID's test, LOOK at the affected frames (every ratio where a defect was reported, plus long-labels and labels-hidden), make automated.json warnings empty or explicitly allow-list only intentional overprints, and finally run ${envOf(i)} node scripts/qa.mjs --ids ${m.ids.join(',')}. Return the structured report.`, {label: `fix:${m.key}`, phase: 'Fix', schema: FIX_SCHEMA}),
  (fix, {m, i}) => agent(`${COMMON}
ROLE: independent final QA reviewer (apply .claude/skills/law-animation-qa/SKILL.md). You did NOT build or fix these. Motif "${m.motif}" (${m.category}): ${m.ids.join(', ')}. Do not edit source files.
Previously recorded findings: ${FILE} → motifs[key="${m.key}"].defects. Fixer's report (verify, do not trust): ${JSON.stringify(fix).slice(0, 2500)}
1. Run ${envOf(i)} node scripts/qa.mjs --ids ${m.ids.join(',')}, then node scripts/accept.mjs --ids ${m.ids.join(',')} (automated_pass = needs your review; accepted = earlier review still valid; implemented = automated checks failing → verdict fail).
2. For every ID needing review: open EVERY contact sheet in production/evidence/<ID>/ with Read; capture and view dense frame strips around the previously reported defects and the main action (node scripts/shot.mjs --id <ID> --times <10 close times> --cols 5 --cell 300 --out production/scratch/final-${m.key}/<ID>.png) and a labels-hidden strip; check automated.json warnings. Verify the recorded defects are gone and look for new ones (label collisions, truncated meaning, fake portrait/square re-layout, garbled cross-fades, connectors not landing, IK artefacts, clipping, detached tags, states shown too early, tiny key labels, legal neutrality). Compare the four treatments: they must be distinct compositions.
3. Record each reviewed ID: node scripts/review.mjs --id <ID> --status pass|fail --reviewer "claude subagent (independent reviewer, workflow repair-from-file)" --method "contact sheets (16:9, 9:16, 1:1, alternative, long-labels, es) and dense frame strips viewed as images; no real-time playback" --artifacts <sheets viewed> --findings "<observations|...>" --content-ok . Pass only at accepted-reference quality; otherwise fail with actionable defects.
Return the structured review.`, {label: `final:${m.key}`, phase: 'Final review', schema: REVIEW_SCHEMA}).then(final => ({key: m.key, fix, final})),
)
return out.map(o => o && {key: o.key, remaining: o.fix && o.fix.remaining, final: o.final && o.final.perId.map(p => ({id: p.id, verdict: p.verdict, defects: p.defects}))})
