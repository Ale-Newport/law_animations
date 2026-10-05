#!/usr/bin/env node
/**
 * Measure import time, create→ready time, seek time, SVG node count and JS
 * heap for implemented animations in local Chromium. Results are specific to
 * the recorded machine/browser; they are measurements, not guarantees.
 *
 *   node scripts/perf.mjs [--ids LAW-0001,...]   (default: all implemented)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {withServer} from './shot.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const get = n => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
const catalog = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
let ids = get('ids') ? get('ids').split(',') : catalog.filter(e => fs.existsSync(path.join(root, e.output.module))).map(e => e.id);

const browser = await chromium.launch();
const results = [];
try {
  await withServer(async base => {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    await page.goto(`${base}/tests/harness/host.html`);
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    for (const id of ids) {
      const r = await page.evaluate(async id => {
        const t0 = performance.now();
        const def = await window.__lib.load(id);
        const tImport = performance.now() - t0;
        const el = document.createElement('div');
        el.style.width = '960px';
        el.style.height = '540px';
        document.body.appendChild(el);
        const t1 = performance.now();
        const inst = def.create(el, {width: 1920, height: 1080, instanceId: `perf-${id}`});
        await inst.ready;
        const tReady = performance.now() - t1;
        const D = inst.durationMs;
        let s = 12345;
        const times = Array.from({length: 240}, () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s / 0x7fffffff) * D; });
        const t2 = performance.now();
        for (const t of times) inst.seek(t);
        const tSeek = (performance.now() - t2) / times.length;
        const nodes = inst.element.querySelectorAll('*').length;
        const heap = performance.memory ? performance.memory.usedJSHeapSize : null;
        inst.destroy();
        el.remove();
        return {id, importMs: +tImport.toFixed(2), createToReadyMs: +tReady.toFixed(2), meanSeekMs: +tSeek.toFixed(3), svgNodes: nodes, usedJSHeapBytes: heap};
      }, id);
      results.push(r);
    }
    await page.close();
  });
} finally {
  await browser.close();
}
const report = {
  measuredAt: new Date().toISOString(),
  environment: {browser: 'chromium (Playwright 1.63.0 bundled, rev 1243)', node: process.version, cpu: os.cpus()[0].model, cores: os.cpus().length, platform: `${process.platform}-${process.arch}`, memoryGB: Math.round(os.totalmem() / 2 ** 30)},
  note: 'Import time includes shared modules only on first load (browser module cache). meanSeekMs = synchronous JS work of seek() (pure evaluation + attribute updates of changed nodes) at 1920x1080; browser style/layout/paint happen afterwards and are NOT included. Local measurements, not universal budgets.',
  results,
  summary: {
    ids: results.length,
    maxMeanSeekMs: Math.max(...results.map(r => r.meanSeekMs)),
    maxSvgNodes: Math.max(...results.map(r => r.svgNodes)),
  },
};
fs.mkdirSync(path.join(root, 'production/perf'), {recursive: true});
fs.writeFileSync(path.join(root, 'production/perf/latest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary), '\n', results.map(r => `${r.id}: import ${r.importMs}ms ready ${r.createToReadyMs}ms seek ${r.meanSeekMs}ms nodes ${r.svgNodes}`).join('\n '));
