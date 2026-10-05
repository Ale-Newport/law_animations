#!/usr/bin/env node
/**
 * Standalone export of selected animations: copies each entry module with its
 * transitive local dependencies (same relative layout), presets, generated
 * metadata, a minimal host page and licence notes into an output folder that
 * works on its own (no dev server globals, no registry, no network).
 *
 *   node scripts/export.mjs --ids LAW-0001,LAW-0004 --out dist/export-sample
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {dependencyClosure} from './lib/hash.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const get = n => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
const ids = (get('ids') || '').split(',').map(s => s.trim()).filter(Boolean);
const out = path.resolve(root, get('out') || 'dist/export');
if (!ids.length) {
  console.error('Usage: node scripts/export.mjs --ids LAW-0001[,...] [--out dist/export]');
  process.exit(2);
}
const catalog = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
fs.rmSync(out, {recursive: true, force: true});
const copied = new Set();
const entries = [];
for (const id of ids) {
  const e = catalog.find(x => x.id === id);
  if (!e || !fs.existsSync(path.join(root, e.output.module))) throw new Error(`${id} is not implemented`);
  for (const file of dependencyClosure(path.join(root, e.output.module))) {
    const rel = path.relative(root, file);
    if (rel.startsWith('..')) throw new Error(`${id} depends on a file outside the project: ${file}`);
    if (!copied.has(rel)) {
      fs.mkdirSync(path.join(out, path.dirname(rel)), {recursive: true});
      fs.copyFileSync(file, path.join(out, rel));
      copied.add(rel);
    }
  }
  for (const f of [e.output.presets, e.output.metadata]) {
    fs.mkdirSync(path.join(out, path.dirname(f)), {recursive: true});
    fs.copyFileSync(path.join(root, f), path.join(out, f));
  }
  entries.push({id, module: e.output.module, presets: e.output.presets, metadata: e.output.metadata});
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({exportedIds: ids, entries, files: [...copied].sort(), note: 'Standalone export: open index.html through any static file server. No network access required.'}, null, 2) + '\n');
fs.copyFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(out, 'THIRD_PARTY_NOTICES.md'));
fs.writeFileSync(path.join(out, 'LICENSE-NOTE.md'), 'Original code and vector artwork created for this project. No third-party runtime code, fonts or assets are included. Content is fictional and illustrative-unverified; it is not a statement of law.\n');
const first = entries[0];
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Standalone animation host</title>
<style>body{margin:0;background:#f6f1e7;font-family:sans-serif}#stage{width:960px;height:540px}</style></head>
<body><div id="stage"></div>
<script type="module">
  const entries = ${JSON.stringify(entries)};
  const params = new URLSearchParams(location.search);
  const pick = entries.find(e => e.id === params.get('id')) || entries[0];
  const {default: def} = await import('./' + pick.module);
  const inst = def.create(document.getElementById('stage'), {width: 1920, height: 1080, instanceId: 'standalone'});
  await inst.ready;
  inst.seek(Number(params.get('t') || def.defaultParams.durationMs));
  window.__standalone = {id: def.id, state: inst.getState({bounds: false})};
  document.body.dataset.ready = '1';
</script></body></html>
`);
console.log(JSON.stringify({out: path.relative(root, out), ids, files: copied.size}, null, 1));
void first;
