// Standalone export test: exports two animations to a temporary folder,
// serves ONLY that folder from a separate loopback server (no dev-server
// globals, no registry, no project files), and imports them in a blank host.
import {test, expect} from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('standalone export works in a separate minimal host', async ({page}) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'law-export-'));
  execFileSync(process.execPath, [path.join(root, 'scripts/export.mjs'), '--ids', 'LAW-0001,LAW-0004', '--out', out]);
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(out, rel);
    if (!file.startsWith(out) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.json') ? 'application/json' : 'text/html'});
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const errors = [];
  const external = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => { if (!r.url().startsWith(base)) external.push(r.url()); });
  try {
    for (const id of ['LAW-0001', 'LAW-0004']) {
      await page.goto(`${base}/index.html?id=${id}`);
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const st = await page.evaluate(() => window.__standalone);
      expect(st.id).toBe(id);
      expect(Object.keys(st.state.nodes).length).toBeGreaterThan(5);
      expect(await page.locator('svg[data-animation-id]').count()).toBe(1);
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
    expect(manifest.files.every(f => f.startsWith('src/'))).toBe(true);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  } finally {
    server.close();
    fs.rmSync(out, {recursive: true, force: true});
  }
});
