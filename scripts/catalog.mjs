#!/usr/bin/env node
/** Read-only planning/audit utility. It NEVER generates or accepts animations. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statuses = new Set(['planned','in_progress','implemented','automated_pass','visual_reviewed','accepted','blocked']);
const implementedStates = new Set(['implemented','automated_pass','visual_reviewed','accepted']);
const args = process.argv.slice(2);
function readJSON(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}
function safeProjectPath(relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('Expected a project-relative path');
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(root + path.sep)) throw new Error('Path escapes project root');
  return resolved;
}
function exists(relative) {
  try { return fs.statSync(safeProjectPath(relative)).isFile(); } catch { return false; }
}
function emit(value) { console.log(JSON.stringify(value, null, 2)); }
function sha256(relative) { return crypto.createHash('sha256').update(fs.readFileSync(safeProjectPath(relative))).digest('hex'); }

try {
  const catalog = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map((line, n) => {
    try { return JSON.parse(line); } catch (error) { throw new Error(`Invalid JSONL at line ${n + 1}: ${error.message}`); }
  });
  const byId = new Map(catalog.map(x => [x.id, x]));
  if (byId.size !== catalog.length) throw new Error('Duplicate catalog IDs');
  const progress = readJSON('production/progress.json');
  const index = readJSON('briefs/index.json');
  const command = args[0] || 'help';

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(`Law-animation-kit: planning utility (not an animation engine)\n\n` +
      `node scripts/catalog.mjs stats\n` +
      `node scripts/catalog.mjs show LAW-0441\n` +
      `node scripts/catalog.mjs category contract-formation\n` +
      `node scripts/catalog.mjs batch B001\n` +
      `node scripts/catalog.mjs pilot\n` +
      `node scripts/catalog.mjs next --limit 20\n` +
      `node scripts/catalog.mjs audit [--require-complete]\n` +
      `\nAll commands are read-only. audit checks structural evidence, not visual or legal quality.`);
  } else if (command === 'stats') {
    const counts = {};
    for (const entry of catalog) {
      const state = progress.entries?.[entry.id]?.status ?? 'missing';
      counts[state] = (counts[state] || 0) + 1;
    }
    emit({target: progress.target, briefs: catalog.length, categories: index.length,
      motifs: new Set(catalog.map(e => `${e.category}/${e.motifIndex}`)).size,
      modulesOnDisk: catalog.filter(e => exists(e.output.module)).length,
      declaredStatuses: counts,
      note: 'Briefs and statuses do not prove working animations. This kit initially has zero implemented modules.'});
  } else if (command === 'show') {
    if (!byId.has(args[1])) throw new Error('Unknown animation ID. Example: show LAW-0441');
    emit({...byId.get(args[1]), progress: progress.entries?.[args[1]] ?? null});
  } else if (command === 'category') {
    const category = index.find(x => x.category === args[1]);
    if (!category) throw new Error('Unknown category slug. Read briefs/index.json');
    emit({category, animations: catalog.filter(e => e.category === args[1])});
  } else if (command === 'batch' || command === 'pilot') {
    const batchId = command === 'pilot' ? 'PILOT' : args[1];
    if (batchId !== 'PILOT' && !/^B\d{3}$/.test(batchId || '')) throw new Error('Expected batch B001 through B100');
    const relative = batchId === 'PILOT' ? 'briefs/pilot.json' : `briefs/batches/${batchId}.json`;
    const batch = readJSON(relative);
    emit({...batch, animations: batch.animationIds.map(id => {
      if (!byId.has(id)) throw new Error(`Unknown ID in batch: ${id}`);
      return {...byId.get(id), progress: progress.entries?.[id] ?? null};
    })});
  } else if (command === 'next') {
    const at = args.indexOf('--limit');
    const limit = at === -1 ? 20 : Number(args[at + 1]);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('--limit must be an integer 1–100');
    const next = catalog.filter(e => {
      const status = progress.entries?.[e.id]?.status ?? 'planned';
      // An accepted declaration without a module must re-enter the queue.
      return status !== 'blocked' && (status !== 'accepted' || !exists(e.output.module));
    }).slice(0, limit).map(e => ({id: e.id, title: e.title, category: e.category,
      declaredStatus: progress.entries?.[e.id]?.status ?? 'missing', moduleExists: exists(e.output.module)}));
    emit({next, note: 'Read each full brief before implementation. Audit accepted items separately; do not trust declarations alone.'});
  } else if (command === 'audit') {
    const errors = [];
    let declaredAccepted = 0;
    for (const entry of catalog) {
      const p = progress.entries?.[entry.id];
      if (!p) { errors.push(`${entry.id}: missing progress record`); continue; }
      if (!statuses.has(p.status)) errors.push(`${entry.id}: invalid status ${p.status}`);
      if (implementedStates.has(p.status)) {
        for (const [kind, relative] of Object.entries(entry.output)) {
          if (!exists(relative)) errors.push(`${entry.id}: missing ${kind}: ${relative}`);
        }
      }
      if (p.status === 'accepted') {
        declaredAccepted++;
        if (!/^[a-f0-9]{64}$/.test(p.implementationHash || '')) errors.push(`${entry.id}: missing entry-file SHA-256 implementationHash`);
        else if (exists(entry.output.module) && sha256(entry.output.module) !== p.implementationHash) errors.push(`${entry.id}: stale entry hash`);
        if (!Array.isArray(p.evidence) || !p.evidence.length) errors.push(`${entry.id}: no evidence paths`);
        else for (const artifact of p.evidence) {
          if (typeof artifact !== 'string' || !exists(artifact)) errors.push(`${entry.id}: missing/invalid evidence path`);
        }
        // Review contents and dependency hashes require the actual QA harness.
      }
    }
    for (const id of Object.keys(progress.entries ?? {})) if (!byId.has(id)) errors.push(`Unknown progress ID: ${id}`);
    if (args.includes('--require-complete') && declaredAccepted !== catalog.length) errors.push(`Target incomplete: ${declaredAccepted}/${catalog.length} declared accepted`);
    emit({structuralAudit: errors.length ? 'fail' : 'pass', declaredAccepted, catalogEntries: catalog.length,
      errors, warning: 'This audit does NOT run animations, prove artistic differentiation, inspect screenshots, validate dependency hashes, or verify law.'});
    if (errors.length) process.exitCode = 1;
  } else {
    throw new Error(`Unknown command: ${command}. Run with --help`);
  }
} catch (error) {
  console.error(`Catalog error: ${error.message}`);
  process.exitCode = 1;
}
