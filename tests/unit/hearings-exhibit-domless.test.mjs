// Hearings · Exhibición de documento (LAW-0301..0304): DOM-less sweep. Every preset (and the defaults) × 16:9 / 9:16 /
// 1:1 × labels shown / hidden evaluates without a DOM, without throwing, at the rest, mid and hold, and deterministically.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
for (const id of ['LAW-0301', 'LAW-0302', 'LAW-0303', 'LAW-0304']) {
  test(`${id}: DOM-less sweep — every preset × ratio × labels state evaluates (no throw, deterministic)`, async () => {
    const def = (await import(pathToFileURL(path.join(root, `src/animations/hearings/${id}.js`)).href)).default;
    const presets = [{name: 'default', params: {}}, ...JSON.parse(fs.readFileSync(path.join(root, `src/animations/hearings/${id}.presets.json`), 'utf8')).presets];
    const D = def.defaultParams.durationMs;
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {...pr.params, textVisibility: tv};
      for (const u of [0, 0.5, 1]) {
        let a;
        assert.doesNotThrow(() => { a = JSON.stringify(def.evaluate({params, width: w, height: h, timeMs: u * D})); }, `${pr.name} ${w}x${h} ${tv} u=${u}`);
        const b = JSON.stringify(def.evaluate({params, width: w, height: h, timeMs: u * D}));
        assert.equal(a, b, `${pr.name} ${w}x${h} ${tv} u=${u} deterministic`);
      }
    }
  });
}

// The page settles and its zone is enlarged at the story's hold; the inspect entry substitutes its region (DOM-less).
test('exhibicion-documento: story hold and inspect substitution (DOM-less)', async () => {
  const story = (await import(pathToFileURL(path.join(root, 'src/animations/hearings/LAW-0301.js')).href)).default;
  const inspect = (await import(pathToFileURL(path.join(root, 'src/animations/hearings/LAW-0304.js')).href)).default;
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const s = story.evaluate({params: {}, width: w, height: h, timeMs: story.defaultParams.durationMs}).semantic;
    assert.equal(s.docState, 'placed', `${w}x${h} page placed`);
    assert.equal(s.zoneState, 'enlarged', `${w}x${h} zone enlarged`);
    const i0 = inspect.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    const i1 = inspect.evaluate({params: {}, width: w, height: h, timeMs: inspect.defaultParams.durationMs}).semantic;
    assert.notDeepEqual(i0.datum, i1.datum, `${w}x${h} the region is substituted`);
  }
});
