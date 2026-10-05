#!/usr/bin/env node
/** Validates the downloaded specification kit, not future animations. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
try {
  const entries = read('briefs/catalog.jsonl').trim().split('\n').map(JSON.parse);
  const index = json('briefs/index.json');
  assert.equal(entries.length, 2000);
  assert.equal(index.length, 50);
  assert.equal(new Set(entries.map(e => e.id)).size, 2000);
  assert.equal(new Set(entries.map(e => e.slug)).size, 2000);
  assert.equal(new Set(entries.map(e => e.output.module)).size, 2000);
  const motifs = new Map();
  for (const e of entries) {
    assert.match(e.id, /^LAW-\d{4}$/);
    assert.equal(e.beats.length, 4);
    assert.ok(e.concreteAction.length > 15);
    assert.ok(e.customizableFields.length >= 4);
    assert.equal(e.requiredPresets.length, 3);
    assert.equal(e.status, 'planned'); // immutable brief state, independent of production progress
    const key = `${e.category}:${e.motifIndex}`;
    if (!motifs.has(key)) motifs.set(key, new Set());
    motifs.get(key).add(e.treatment);
  }
  assert.equal(motifs.size, 500);
  for (const variants of motifs.values()) assert.deepEqual([...variants].sort(), ['contrast','inspect','mechanism','story']);
  const batchIds = [];
  for (let n = 1; n <= 100; n++) {
    const batch = json(`briefs/batches/B${String(n).padStart(3, '0')}.json`);
    assert.equal(batch.animationIds.length, 20);
    batchIds.push(...batch.animationIds);
  }
  assert.equal(batchIds.length, 2000);
  assert.equal(new Set(batchIds).size, 2000);
  assert.deepEqual(new Set(batchIds), new Set(entries.map(e => e.id)));
  for (const cat of index) {
    assert.equal(entries.filter(e => e.category === cat.category).length, 40);
    assert.equal(cat.motifs.length, 10);
    assert.ok(read(cat.briefPath).includes(cat.firstId));
    assert.ok(read(cat.briefPath).includes(cat.lastId));
  }
  for (const id of json('briefs/pilot.json').animationIds) assert.ok(entries.find(e => e.id === id));
  for (const skill of ['law-animation-library','law-animation-qa']) {
    const content = read(`.claude/skills/${skill}/SKILL.md`);
    assert.ok(content.startsWith('---\n'));
    assert.ok(content.includes(`name: ${skill}\n`));
    assert.ok(content.includes('description:'));
  }
  for (const p of ['CLAUDE.md','README_ES.md','prompts/MASTER_PROMPT.md','docs/RUNTIME_CONTRACT.md','docs/ACCEPTANCE.md','docs/LEGAL_CONTENT_POLICY.md','docs/VISUAL_STANDARD.md','docs/PRODUCTION_WORKFLOW.md']) assert.ok(read(p).length > 100);
  console.log('PASS: 2 custom skills; 50 categories; 500 motifs; 2,000 individual briefs; 100 complete batches; 16 pilot IDs.');
  console.log('This validates the instruction kit only. It does not mean 2,000 animations have been implemented.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
