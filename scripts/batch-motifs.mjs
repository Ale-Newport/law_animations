#!/usr/bin/env node
/**
 * Group the IDs of one or more planning batches into motifs (4 IDs each) and
 * print them as JSON — the input for a production run. Motifs whose four IDs
 * are all accepted are skipped.
 *
 *   node scripts/batch-motifs.mjs B001 B002
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const byId = new Map(catalog.map(e => [e.id, e]));
const progress = JSON.parse(fs.readFileSync(path.join(root, 'production/progress.json'), 'utf8'));
const batches = process.argv.slice(2).filter(a => /^B\d{3}$/.test(a));
if (!batches.length) {
  console.error('Usage: node scripts/batch-motifs.mjs B001 [B002 ...]');
  process.exit(2);
}
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const motifs = [];
for (const b of batches) {
  const ids = JSON.parse(fs.readFileSync(path.join(root, `briefs/batches/${b}.json`), 'utf8')).animationIds;
  const groups = new Map();
  for (const id of ids) {
    const e = byId.get(id);
    const k = `${e.category}#${e.motifIndex}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  }
  for (const list of groups.values()) {
    const e = list[0];
    const all = list.map(x => x.id);
    if (all.every(id => progress.entries[id] && progress.entries[id].status === 'accepted')) continue;
    motifs.push({
      key: `${e.category}-${String(e.motifIndex).padStart(2, '0')}`,
      batch: b,
      category: e.category,
      motif: e.motif,
      slug: slugify(e.motif),
      ids: all,
      treatments: list.map(x => x.treatment),
      action: e.concreteAction,
      comparison: e.comparison,
      objects: e.objects,
    });
  }
}
console.log(JSON.stringify(motifs, null, 1));
