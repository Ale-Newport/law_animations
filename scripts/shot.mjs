#!/usr/bin/env node
/**
 * Capture a QA contact sheet (real render of independent instances seeked to
 * the requested times) to a PNG.
 *
 *   node scripts/shot.mjs --id LAW-0001 [--ratio 16:9] [--times 0,0.2,0.5,0.8,1]
 *        [--preset name] [--bg paper] [--params '{"locale":"es"}'] [--out file.png]
 *        [--cell 520] [--cols 3] [--safe]
 *
 * Starts a loopback-only static server on an ephemeral port for the duration.
 */
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createServer} from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function withServer(fn) {
  const server = createServer();
  await new Promise(res => server.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(base);
  } finally {
    server.close();
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} base
 * @param {{id:string, ratio?:string, times?:string, preset?:string, bg?:string, params?:string, cell?:number, cols?:number, safe?:boolean}} o
 * @param {string} out
 */
export async function captureSheet(page, base, o, out) {
  const q = new URLSearchParams({id: o.id, ratio: o.ratio || '16:9'});
  if (o.times) q.set('times', o.times);
  if (o.preset) q.set('preset', o.preset);
  if (o.bg) q.set('bg', o.bg);
  if (o.params) q.set('params', o.params);
  if (o.cell) q.set('cell', String(o.cell));
  if (o.cols) q.set('cols', String(o.cols));
  if (o.safe) q.set('safe', '1');
  const errors = [];
  const external = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { const u = new URL(r.url()); if (u.hostname !== '127.0.0.1') external.push(r.url()); });
  await page.goto(`${base}/gallery/qa.html?${q}`);
  await page.waitForFunction(() => document.body.dataset.ready, null, {timeout: 20000});
  const state = await page.evaluate(() => document.body.dataset.ready);
  if (state === 'error') errors.push(await page.textContent('#error'));
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  await page.screenshot({path: out, fullPage: true});
  return {errors, external};
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const USAGE = 'Usage: node scripts/shot.mjs --id LAW-0001 [--ratio 16:9] [--times 0,0.5,1] [--preset name] [--bg paper] [--params \'{"locale":"es"}\'] [--out file.png] [--cell 520] [--cols 3] [--safe]';
  if (args.includes('--help') || args.includes('-h')) { console.log(USAGE); process.exit(0); }
  // Reject unknown flags so a typo (e.g. --presets) never silently renders the defaults.
  const KNOWN = new Set(['id', 'ratio', 'times', 'preset', 'bg', 'params', 'out', 'cell', 'cols', 'safe']);
  const unknown = args.filter(a => a.startsWith('--') && !KNOWN.has(a.slice(2)));
  if (unknown.length || !args.includes('--id')) { console.error(`${unknown.length ? `Unknown option(s): ${unknown.join(' ')}\n` : 'Missing --id\n'}${USAGE}`); process.exit(2); }
  const get = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
  const o = {id: get('id', 'LAW-0001'), ratio: get('ratio', '16:9'), times: get('times'), preset: get('preset'), bg: get('bg'), params: get('params'), cell: get('cell') && Number(get('cell')), cols: get('cols') && Number(get('cols')), safe: args.includes('--safe')};
  const out = path.resolve(root, get('out', `production/scratch/${o.id}-${o.ratio.replace(':', 'x')}.png`));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport: {width: 1640, height: 900}, deviceScaleFactor: 1});
    const res = await withServer(base => captureSheet(page, base, o, out));
    console.log(JSON.stringify({out: path.relative(root, out), ...res}));
    if (res.errors.length || res.external.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
