#!/usr/bin/env node
/**
 * Minimal static file server for the local gallery and QA pages.
 * Binds to loopback (127.0.0.1) by default. Serves only files inside the
 * project root; no directory listing, no uploads, no proxying.
 *
 *   node scripts/serve.mjs [--port 5178] [--host 127.0.0.1]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const port = Number(opt('port', process.env.PORT || 5178));
const host = opt('host', '127.0.0.1');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};
const DENY = [/^\.env/, /^node_modules\//, /^\.claude\//, /^\.git\//];

export function createServer() {
  return http.createServer((req, res) => {
    try {
      const url = new URL(req.url, `http://${host}`);
      let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (rel === '') {
        res.writeHead(302, {Location: '/gallery/'});
        return res.end();
      }
      if (rel.endsWith('/')) rel += 'index.html';
      if (DENY.some(re => re.test(rel))) return send(res, 403, 'Forbidden');
      const file = path.resolve(root, rel);
      if (!file.startsWith(root + path.sep)) return send(res, 403, 'Forbidden');
      fs.stat(file, (err, st) => {
        if (err || !st.isFile()) return send(res, 404, 'Not found');
        res.writeHead(200, {
          'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        });
        fs.createReadStream(file).pipe(res);
      });
    } catch {
      send(res, 400, 'Bad request');
    }
  });
}

function send(res, code, text) {
  res.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8'});
  res.end(text);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(port, host, () => {
    console.log(`Law animation gallery: http://${host}:${port}/gallery/  (loopback only)`);
  });
}
