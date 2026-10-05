/**
 * Source hashing: entry-file SHA-256 (catalog audit) and an effective source
 * hash over the entry plus every transitive local import, so a change in a
 * shared primitive invalidates dependent evidence.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** All local files reachable from `entry` via static relative imports. */
export function dependencyClosure(entry) {
  const seen = new Set();
  const stack = [path.resolve(entry)];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(IMPORT_RE)) {
      const rel = m[1] || m[2];
      const dep = path.resolve(path.dirname(file), rel);
      if (fs.existsSync(dep)) stack.push(dep);
    }
  }
  return [...seen].sort();
}

/**
 * @param {string} root project root
 * @param {string} entry absolute path of the entry module
 */
export function sourceHash(root, entry) {
  const files = dependencyClosure(entry);
  const h = crypto.createHash('sha256');
  const listed = [];
  for (const f of files) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    listed.push(rel);
    h.update(rel);
    h.update('\0');
    h.update(fs.readFileSync(f));
    h.update('\0');
  }
  return {hash: h.digest('hex'), files: listed};
}
