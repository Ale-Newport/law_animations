#!/usr/bin/env node
/**
 * Record an ACTUAL visual review (Gate C) and content check (Gate D) for one
 * ID. Run this only after the reviewer has examined the listed images or the
 * live scene. The review is bound to the current effective source hash; any
 * later change to the entry or a shared dependency invalidates it.
 *
 *   node scripts/review.mjs --id LAW-0001 --status pass|fail \
 *     --reviewer "name / model" --method "contact sheets viewed; live playback in gallery" \
 *     --artifacts sheet-16x9-baseline.png,sheet-9x16-baseline.png \
 *     --findings "finding one|finding two" [--content-ok] [--live "what was watched"]
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceHash} from './lib/hash.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const get = n => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
const id = get('id');
const status = get('status');
if (!id || !['pass', 'fail'].includes(status) || !get('reviewer') || !get('method') || !get('artifacts')) {
  console.error('Usage: --id LAW-xxxx --status pass|fail --reviewer ... --method ... --artifacts a.png,b.png [--findings "a|b"] [--content-ok] [--live "..."]');
  process.exit(2);
}
const entry = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).find(e => e.id === id);
if (!entry) throw new Error(`Unknown ID ${id}`);
const dir = path.join(root, 'production/evidence', id);
const file = path.join(dir, 'review.json');
if (!fs.existsSync(file)) throw new Error(`No review.json for ${id}; run scripts/qa.mjs first`);
const record = JSON.parse(fs.readFileSync(file, 'utf8'));
const current = sourceHash(root, path.join(root, entry.output.module)).hash;
if (record.sourceHash !== current) throw new Error(`${id}: captures were made for an older source hash; re-run scripts/qa.mjs before reviewing`);
const artifacts = get('artifacts').split(',').map(s => s.trim()).filter(Boolean).map(a => (a.includes('/') ? a : `production/evidence/${id}/${a}`));
for (const a of artifacts) if (!fs.existsSync(path.join(root, a))) throw new Error(`Artifact not found: ${a}`);
record.visualReview = {
  status,
  reviewer: get('reviewer'),
  method: get('method'),
  live: get('live'),
  artifacts,
  findings: (get('findings') || '').split('|').map(s => s.trim()).filter(Boolean),
  sourceHash: current,
  renderFingerprint: record.renderFingerprint || null,
  reviewedAt: new Date().toISOString(),
};
record.contentReview = {
  status: args.includes('--content-ok') ? 'pass' : 'not_confirmed',
  scope: 'Illustrative labelling, fictional data, no legal conclusion/verdict/ranking in the rendered scene. Not a legal verification.',
  legalStatus: 'illustrative-unverified',
};
fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n');
console.log(`${id}: visual review recorded (${status}) for source ${current.slice(0, 12)}…`);
