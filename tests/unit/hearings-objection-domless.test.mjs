// Hearings · Objeción procesal (LAW-0297..0300): DOM-less sweep. Every preset (and the defaults) × 16:9 / 9:16 / 1:1
// × labels shown / hidden evaluates without a DOM, without throwing, at the rest, mid and hold, and deterministically.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
for (const id of ['LAW-0297', 'LAW-0298', 'LAW-0299', 'LAW-0300']) {
  test(`${id}: DOM-less sweep — every preset × ratio × labels state evaluates (no throw, deterministic)`, async () => {
    const def = (await import(pathToFileURL(path.join(root, `src/animations/hearings/${id}.js`)).href)).default;
    const presets = [{name: 'default', params: {}}, ...JSON.parse(fs.readFileSync(path.join(root, `src/animations/hearings/${id}.presets.json`), 'utf8')).presets];
    const D = def.defaultParams.durationMs;
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {...pr.params, textVisibility: tv};
      for (const u of [0, 0.5, 1]) {
        let a, b;
        assert.doesNotThrow(() => { a = JSON.stringify(def.evaluate({params, width: w, height: h, timeMs: u * D})); }, `${pr.name} ${w}x${h} ${tv} u=${u}`);
        b = JSON.stringify(def.evaluate({params, width: w, height: h, timeMs: u * D}));
        assert.equal(a, b, `${pr.name} ${w}x${h} ${tv} u=${u} deterministic`);
      }
    }
  });
}

// The kit's route planner is deterministic and finds a clear route for the default story.
test('objecion-procesal: card routes are clear and identical on re-evaluation (DOM-less)', async () => {
  const def = (await import(pathToFileURL(path.join(root, 'src/animations/hearings/LAW-0297.js')).href)).default;
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const a = def.evaluate({params: {}, width: w, height: h, timeMs: 3000}).semantic;
    const b = def.evaluate({params: {}, width: w, height: h, timeMs: 3000}).semantic;
    assert.equal(a.routesClear, true, `${w}x${h} routes clear`);
    assert.deepEqual(a, b, `${w}x${h} deterministic`);
  }
});
