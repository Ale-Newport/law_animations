#!/usr/bin/env node
/**
 * QA evidence generator (Gate A + Gate B + capture for Gate C).
 *
 *   node scripts/qa.mjs --ids LAW-0001,LAW-0002     (or --batch B001 / --pilot)
 *
 * For each ID:
 *  1. Gate A: entry, metadata, presets and test files exist; presets validate.
 *  2. Gate B: runs the ID's Playwright contract test and records its exit code.
 *  3. Captures real renders for visual review: five-keyframe contact sheets in
 *     16:9, 9:16 and 1:1 (baseline preset) plus 16:9 alternative and
 *     long-label presets, and a gallery thumbnail.
 *  4. Writes production/evidence/<ID>/review.json with hashes and results.
 *     visualReview stays "not_reviewed" — only scripts/review.mjs, run after a
 *     person/vision reviewer has actually examined the images, sets it.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {withServer, captureSheet} from './shot.mjs';
import crypto from 'node:crypto';
import {sha256File, sourceHash} from './lib/hash.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const get = n => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
const catalog = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const byId = new Map(catalog.map(e => [e.id, e]));

let ids = [];
if (get('ids')) ids = get('ids').split(',').map(s => s.trim()).filter(Boolean);
else if (get('batch')) ids = JSON.parse(fs.readFileSync(path.join(root, `briefs/batches/${get('batch')}.json`), 'utf8')).animationIds;
else if (args.includes('--pilot')) ids = JSON.parse(fs.readFileSync(path.join(root, 'briefs/pilot.json'), 'utf8')).animationIds;
if (!ids.length) {
  console.error('Usage: node scripts/qa.mjs --ids LAW-0001,... | --batch B001 | --pilot');
  process.exit(2);
}
const skipTests = args.includes('--no-tests');

const KEYFRAMES = {
  story: [0.05, 0.3, 0.5, 0.68, 1],
  mechanism: [0.12, 0.35, 0.55, 0.72, 1],
  contrast: [0.1, 0.3, 0.55, 0.72, 1],
  inspect: [0.1, 0.4, 0.6, 0.8, 1],
};

buildRegistry();

const browser = await chromium.launch();
const browserVersion = browser.version();
const summary = [];
try {
  await withServer(async base => {
    for (const id of ids) {
      const entry = byId.get(id);
      if (!entry) { summary.push({id, error: 'unknown id'}); continue; }
      const dir = path.join(root, 'production/evidence', id);
      fs.mkdirSync(dir, {recursive: true});
      const rel = p => path.relative(root, p).split(path.sep).join('/');
      const record = {
        animationId: id,
        generatedBy: 'scripts/qa.mjs',
        treatment: entry.treatment,
        sourceHash: null,
        implementationHash: null,
        dependencies: [],
        environment: {browser: `chromium ${browserVersion}`, playwright: '@playwright/test 1.63.0', node: process.version, platform: `${process.platform}-${process.arch}`, fonts: 'system font stack (see src/core/text.js FONTS)'},
        commands: [],
        structure: {},
        automatedChecks: {status: 'not_run'},
        captures: [],
        visualReview: {status: 'not_reviewed', reviewer: null, method: null, artifacts: [], findings: []},
        legalStatus: 'illustrative-unverified',
        testedConfigurations: [],
        knownIssues: [],
        accepted: false,
      };
      // --- Gate A: structure
      const files = entry.output;
      const exists = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, fs.existsSync(path.join(root, f))]));
      record.structure = {files, exists};
      if (!exists.module) { summary.push({id, error: 'module missing'}); writeRecord(dir, record); continue; }
      const sh = sourceHash(root, path.join(root, files.module));
      record.sourceHash = sh.hash;
      record.dependencies = sh.files;
      record.implementationHash = sha256File(path.join(root, files.module));
      let presets = [];
      try {
        presets = JSON.parse(fs.readFileSync(path.join(root, files.presets), 'utf8')).presets;
        const names = presets.map(p => p.name);
        record.structure.presets = names;
        record.structure.requiredPresetsPresent = entry.requiredPresets.every(n => names.includes(n));
      } catch (e) {
        record.structure.presetsError = String(e.message);
      }
      // --- Gate B: contract test
      if (!skipTests && exists.test) {
        const cmd = ['playwright', 'test', files.test, '--reporter=line'];
        const res = spawnSync('npx', cmd, {cwd: root, encoding: 'utf8', timeout: 600000});
        record.commands.push({command: `npx ${cmd.join(' ')}`, exitCode: res.status});
        let automated = null;
        try { automated = JSON.parse(fs.readFileSync(path.join(dir, 'automated.json'), 'utf8')); } catch { /* none */ }
        record.automatedChecks = {
          status: res.status === 0 && automated && automated.passed ? 'pass' : 'fail',
          exitCode: res.status,
          checks: automated ? automated.checks.length : 0,
          failed: automated ? automated.checks.filter(c => !c.pass).map(c => c.name) : ['no automated.json'],
          details: 'production/evidence/' + id + '/automated.json',
          sourceHashAtRun: sh.hash,
        };
      }
      // --- captures for visual review
      const times = (entry.treatment && KEYFRAMES[entry.treatment] || KEYFRAMES.story).join(',');
      const page = await browser.newPage({viewport: {width: 1640, height: 900}, deviceScaleFactor: 1});
      const shots = [
        {file: 'sheet-16x9-baseline.png', ratio: '16:9', preset: 'baseline-illustrative', cols: 3, cell: 520},
        {file: 'sheet-9x16-baseline.png', ratio: '9:16', preset: 'baseline-illustrative', cols: 5, cell: 300},
        {file: 'sheet-1x1-baseline.png', ratio: '1:1', preset: 'baseline-illustrative', cols: 5, cell: 310},
        {file: 'sheet-16x9-alternative.png', ratio: '16:9', preset: 'contrast-or-alternative', cols: 3, cell: 520},
        {file: 'sheet-16x9-long-labels.png', ratio: '16:9', preset: 'long-labels-stress', cols: 3, cell: 520},
      ];
      if (presets.some(p => p.name === 'baseline-es')) shots.push({file: 'sheet-16x9-es.png', ratio: '16:9', preset: 'baseline-es', cols: 3, cell: 520});
      if (entry.treatment === 'contrast') shots.push({file: 'sheet-9x16-alternative.png', ratio: '9:16', preset: 'contrast-or-alternative', cols: 5, cell: 300});
      const captureErrors = [];
      for (const s of shots) {
        const out = path.join(dir, s.file);
        const res = await captureSheet(page, base, {id, ratio: s.ratio, times, preset: s.preset, cols: s.cols, cell: s.cell, bg: 'paper'}, out);
        record.captures.push({path: rel(out), ratio: s.ratio, preset: s.preset, times: times.split(',').map(Number), background: 'paper', errors: res.errors, externalRequests: res.external});
        record.testedConfigurations.push(`${s.ratio} ${s.preset} editorial-flat paper`);
        captureErrors.push(...res.errors, ...res.external);
      }
      // render fingerprint: exact SVG markup at the keyframes for 3 ratios ×
      // 3 presets. Identical fingerprint = identical pictures, which lets a
      // visual review survive a shared-code change that does not alter output.
      try {
        const fpPage = await browser.newPage({viewport: {width: 800, height: 600}});
        await fpPage.goto(`${base}/tests/harness/host.html`);
        await fpPage.waitForFunction(() => document.body.dataset.ready === '1');
        const fpPresets = presets.filter(p => ['baseline-illustrative', 'contrast-or-alternative', 'long-labels-stress'].includes(p.name));
        const markup = await fpPage.evaluate(async ([id, presetList, ts]) => {
          const def = await window.__lib.load(id);
          const out = [];
          for (const p of presetList) {
            for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
              const el = document.createElement('div');
              document.body.appendChild(el);
              const inst = def.create(el, {width: w, height: h, instanceId: 'fingerprint', params: p.params});
              await inst.ready;
              for (const t of ts) {
                inst.seek(t * inst.durationMs);
                out.push(`${p.name}|${w}x${h}|${t}|${inst.element.outerHTML}`);
              }
              inst.destroy();
              el.remove();
            }
          }
          return out;
        }, [id, fpPresets, times.split(',').map(Number)]);
        record.renderFingerprint = crypto.createHash('sha256').update(markup.join('\n')).digest('hex');
        record.renderFingerprintScope = `${fpPresets.map(p => p.name).join(', ')} × 16:9/9:16/1:1 × t=${times}`;
        await fpPage.close();
      } catch (e) {
        record.renderFingerprint = null;
        record.renderFingerprintError = String(e.message || e);
      }
      // thumbnail: final state, 16:9 baseline
      const thumb = path.join(dir, 'thumb.png');
      await page.setViewportSize({width: 520, height: 340});
      await page.goto(`${base}/gallery/qa.html?id=${id}&ratio=16:9&times=0.9&cols=1&cell=480&bg=paper`);
      await page.waitForFunction(() => document.body.dataset.ready);
      const fig = await page.$('.frame');
      if (fig) await fig.screenshot({path: thumb});
      await page.close();
      record.thumb = rel(thumb);
      record.captureErrors = captureErrors;
      writeRecord(dir, record);
      summary.push({id, automated: record.automatedChecks.status, captures: record.captures.length, captureErrors: captureErrors.length});
      console.log(`${id}: automated=${record.automatedChecks.status} captures=${record.captures.length} errors=${captureErrors.length}`);
    }
  });
} finally {
  await browser.close();
}
buildRegistry();
console.log(JSON.stringify(summary, null, 1));

function writeRecord(dir, record) {
  // Preserve an existing visual review if it was made against the same source
  // hash, or if the rendered output is byte-identical (same render
  // fingerprint) to what the reviewer saw. Otherwise it is invalidated.
  const file = path.join(dir, 'review.json');
  if (fs.existsSync(file)) {
    try {
      const prev = JSON.parse(fs.readFileSync(file, 'utf8'));
      const vr = prev.visualReview;
      if (vr && vr.status !== 'not_reviewed') {
        if (vr.sourceHash === record.sourceHash) {
          // same source ⇒ same output: backfill the fingerprint of the reviewed render
          record.visualReview = vr.renderFingerprint ? vr : {...vr, renderFingerprint: record.renderFingerprint};
        }
        else if (vr.renderFingerprint && record.renderFingerprint && vr.renderFingerprint === record.renderFingerprint) {
          record.visualReview = {...vr, carriedForward: {fromSourceHash: vr.sourceHash, toSourceHash: record.sourceHash, reason: 'render fingerprint identical to the reviewed output'}};
        } else record.previousVisualReview = {...vr, invalidated: 'source changed and rendered output differs from what was reviewed'};
      }
      if (prev.contentReview && record.visualReview.status !== 'not_reviewed') record.contentReview = prev.contentReview;
    } catch { /* ignore */ }
  }
  fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n');
}

/**
 * Rebuild the registry. A metadata error in ANOTHER module (e.g. one that a
 * parallel builder is still writing) must not block QA of unrelated IDs: the
 * registry file is still written, so continue with a warning.
 */
function buildRegistry() {
  try {
    execFileSync(process.execPath, [path.join(root, 'scripts/build-registry.mjs')], {stdio: 'pipe'});
  } catch (e) {
    const out = String((e.stdout || '') + (e.stderr || '')).slice(0, 600);
    console.warn(`warning: build-registry reported errors (continuing):\n${out}`);
  }
}
