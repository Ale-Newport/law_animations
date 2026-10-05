#!/usr/bin/env node
/**
 * Gate keeper for production/progress.json. Computes each ID's lifecycle
 * status from real files and CURRENT evidence — it cannot be told to accept.
 *
 *   node scripts/accept.mjs --ids LAW-0001,...  |  --all
 *
 *   implemented     entry, metadata, presets and test exist; entry imports
 *   automated_pass  + contract test passed for the current source hash
 *   visual_reviewed + recorded visual review passed for the current source hash
 *   accepted        + required presets present + content check confirmed
 * Evidence invalidated by a source change drops the status accordingly.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {sha256File, sourceHash} from './lib/hash.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const get = n => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
const catalog = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const progressFile = path.join(root, 'production/progress.json');
const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));

let ids;
if (args.includes('--all')) ids = catalog.filter(e => fs.existsSync(path.join(root, e.output.module))).map(e => e.id);
else if (get('ids')) ids = get('ids').split(',').map(s => s.trim());
else { console.error('Usage: --ids LAW-0001,... | --all'); process.exit(2); }

const out = [];
for (const id of ids) {
  const e = catalog.find(x => x.id === id);
  const p = progress.entries[id];
  if (!e || !p) { out.push({id, error: 'unknown'}); continue; }
  const abs = f => path.join(root, f);
  const reasons = [];
  let status = 'planned';
  const allFiles = Object.values(e.output).every(f => fs.existsSync(abs(f)));
  if (fs.existsSync(abs(e.output.module))) status = 'in_progress';
  if (allFiles) {
    try {
      const mod = await import(pathToFileURL(abs(e.output.module)).href + `?t=${Date.now()}`);
      if (mod.default && mod.default.id === id && typeof mod.default.create === 'function') status = 'implemented';
      else reasons.push('entry does not export a matching definition');
    } catch (err) {
      reasons.push(`entry import failed: ${err.message}`);
    }
  } else reasons.push('missing module/metadata/presets/test');
  const current = status === 'implemented' ? sourceHash(root, abs(e.output.module)).hash : null;
  let review = null;
  try { review = JSON.parse(fs.readFileSync(abs(`production/evidence/${id}/review.json`), 'utf8')); } catch { /* none */ }
  if (status === 'implemented') {
    if (review && review.automatedChecks && review.automatedChecks.status === 'pass' && review.automatedChecks.sourceHashAtRun === current) status = 'automated_pass';
    else reasons.push('no passing contract test for the current source hash');
  }
  if (status === 'automated_pass') {
    const vr = review.visualReview;
    const bound = vr && vr.status === 'pass' && (vr.sourceHash === current
      // carried forward only when the latest QA run (for this exact source) rendered byte-identical output
      || (vr.carriedForward && vr.carriedForward.toSourceHash === current && review.sourceHash === current && vr.renderFingerprint && vr.renderFingerprint === review.renderFingerprint));
    if (bound) status = 'visual_reviewed';
    else reasons.push('no passing visual review for the current source hash or identical rendered output');
  }
  if (status === 'visual_reviewed') {
    const presetsOk = review.structure && review.structure.requiredPresetsPresent;
    const contentOk = review.contentReview && review.contentReview.status === 'pass';
    if (presetsOk && contentOk) status = 'accepted';
    else reasons.push(!presetsOk ? 'required presets missing' : 'content check not confirmed');
  }
  const evidence = review ? [
    `production/evidence/${id}/review.json`,
    `production/evidence/${id}/automated.json`,
    ...(review.visualReview && review.visualReview.artifacts ? review.visualReview.artifacts : []),
  ].filter(f => fs.existsSync(abs(f))) : [];
  progress.entries[id] = {
    ...p,
    status,
    implementationHash: fs.existsSync(abs(e.output.module)) ? sha256File(abs(e.output.module)) : null,
    sourceHash: current,
    evidence,
    legalStatus: 'illustrative-unverified',
    ...(reasons.length ? {pending: reasons} : {pending: undefined}),
  };
  out.push({id, status, reasons});
}
fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2) + '\n');
const counts = {};
for (const v of Object.values(progress.entries)) counts[v.status] = (counts[v.status] || 0) + 1;
console.log(JSON.stringify({updated: out, totals: counts}, null, 1));
