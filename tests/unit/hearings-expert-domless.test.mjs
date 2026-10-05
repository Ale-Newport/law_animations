// Hearings · Declaración experta en audiencia (LAW-0305..0308): DOM-less sweep. Every preset (and the defaults) × 16:9 / 9:16 /
// 1:1 × labels shown / hidden evaluates without a DOM, without throwing, at the rest, mid and hold, and deterministically.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
for (const id of ['LAW-0305', 'LAW-0306', 'LAW-0307', 'LAW-0308']) {
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

// The chart settles and the explanation is connected at the story's hold; the inspect entry substitutes its span; the
// contrast differs only in the interpretation (DOM-less).
test('declaracion-experta: story hold, contrast difference and inspect substitution (DOM-less)', async () => {
  const load = async id => (await import(pathToFileURL(path.join(root, `src/animations/hearings/${id}.js`)).href)).default;
  const story = await load('LAW-0305'), contrast = await load('LAW-0307'), inspect = await load('LAW-0308');
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const s = story.evaluate({params: {}, width: w, height: h, timeMs: story.defaultParams.durationMs}).semantic;
    assert.equal(s.chartState, 'placed', `${w}x${h} chart placed`);
    assert.equal(s.explanationState, 'connected', `${w}x${h} explanation connected`);
    const c = contrast.evaluate({params: {}, width: w, height: h, timeMs: contrast.defaultParams.durationMs}).semantic;
    assert.equal(c.explanationA, 'none', `${w}x${h} A has no explanation`);
    assert.equal(c.explanationB, 'connected', `${w}x${h} B has the connected explanation`);
    assert.equal(c.lookA, c.lookB, `${w}x${h} everything else identical`);
    const i0 = inspect.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    const i1 = inspect.evaluate({params: {}, width: w, height: h, timeMs: inspect.defaultParams.durationMs}).semantic;
    assert.equal(i0.spanState, 'before', `${w}x${h} before`);
    assert.equal(i1.spanState, 'after', `${w}x${h} the span is substituted`);
  }
});
