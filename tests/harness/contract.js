/**
 * Node-side wrapper: runs the in-page contract battery for one animation ID
 * and turns each result into a Playwright assertion.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test, expect} from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Load the saved presets of an ID from its catalog-declared presets file. */
export function presetsFor(id) {
  const re = new RegExp(`^\\{\\s*"id":\\s*"${id}"`);
  const line = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').split('\n').find(l => re.test(l));
  if (!line) throw new Error(`Unknown ID ${id}`);
  const entry = JSON.parse(line);
  return JSON.parse(fs.readFileSync(path.join(root, entry.output.presets), 'utf8')).presets;
}

/**
 * @param {string} id
 * @param {{semantic?: Array<{at:number, fn:string, label?:string, params?:object}>, continuity?: string[], continuityLimit?: number, attach?: Array<{from:number,to:number,a:string,b:string,tol:number}>}} spec
 */
export function contractSuite(id, spec = {}) {
  test.describe(`${id} runtime contract`, () => {
    test(`${id}: contract, determinism, layout matrix and semantics`, async ({page}) => {
      const consoleErrors = [];
      const external = [];
      page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', e => consoleErrors.push(String(e)));
      page.on('request', r => { const u = new URL(r.url()); if (u.hostname !== '127.0.0.1') external.push(r.url()); });
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const presets = presetsFor(id);
      const out = await page.evaluate(([i, s]) => window.__lib.contract(i, s), [id, {...spec, presets}]);
      const failed = out.results.filter(r => !r.pass);
      for (const r of out.results) {
        expect.soft(r.pass, `${r.name}\n${JSON.stringify(r.detail, null, 1)}`).toBe(true);
      }
      expect.soft(consoleErrors, 'console errors').toEqual([]);
      expect.soft(external, 'requests to non-loopback hosts').toEqual([]);
      test.info().annotations.push({type: 'checks', description: `${out.results.length - failed.length}/${out.results.length} passed`});
      const dir = path.join(root, 'production/evidence', id);
      fs.mkdirSync(dir, {recursive: true});
      fs.writeFileSync(path.join(dir, 'automated.json'), JSON.stringify({
        animationId: id,
        runner: '@playwright/test chromium',
        checks: out.results,
        warnings: out.warnings || [],
        warningsNote: 'Heuristic, non-blocking: overlapping visible text blocks and low use of the caption-safe box (<80% on both axes at the final hold). Reviewers must look at these cases.',
        consoleErrors,
        externalRequests: external,
        passed: failed.length === 0 && consoleErrors.length === 0 && external.length === 0,
      }, null, 2) + '\n');
    });
  });
}
