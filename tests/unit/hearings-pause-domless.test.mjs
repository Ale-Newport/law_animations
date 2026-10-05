// Hearings · Pausa de audiencia (LAW-0309..0312): DOM-less sweep. Every preset (and the defaults, and an es-only render)
// × 16:9 / 9:16 / 1:1 × labels shown / hidden evaluates without a DOM, without throwing, at the rest, mid and hold, and
// deterministically.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
for (const id of ['LAW-0309', 'LAW-0310', 'LAW-0311', 'LAW-0312']) {
  test(`${id}: DOM-less sweep — every preset × ratio × labels state evaluates (no throw, deterministic)`, async () => {
    const def = (await import(pathToFileURL(path.join(root, `src/animations/hearings/${id}.js`)).href)).default;
    const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...JSON.parse(fs.readFileSync(path.join(root, `src/animations/hearings/${id}.presets.json`), 'utf8')).presets];
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

// The session clock stops and the recess card is connected at the story's hold; the contrast keeps A active and pauses B;
// the inspect entry substitutes the recess time (DOM-less).
test('pausa-audiencia: story hold, contrast difference and inspect substitution (DOM-less)', async () => {
  const load = async id => (await import(pathToFileURL(path.join(root, `src/animations/hearings/${id}.js`)).href)).default;
  const story = await load('LAW-0309'), contrast = await load('LAW-0311'), inspect = await load('LAW-0312');
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const s = story.evaluate({params: {}, width: w, height: h, timeMs: story.defaultParams.durationMs}).semantic;
    const s0 = story.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    assert.equal(s.clockState, 'stopped', `${w}x${h} session clock stopped`);
    assert.equal(s.cardState, 'connected', `${w}x${h} recess card connected`);
    assert.deepEqual(s.positions, s0.positions, `${w}x${h} positions kept`);
    const c = contrast.evaluate({params: {}, width: w, height: h, timeMs: contrast.defaultParams.durationMs}).semantic;
    assert.equal(c.clockA, 'running', `${w}x${h} A stays active`);
    assert.equal(c.clockB, 'stopped', `${w}x${h} B paused`);
    assert.equal(c.lookA, c.lookB, `${w}x${h} everything else identical`);
    const i0 = inspect.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    const i1 = inspect.evaluate({params: {}, width: w, height: h, timeMs: inspect.defaultParams.durationMs}).semantic;
    assert.equal(i0.timeState, 'before', `${w}x${h} before`);
    assert.equal(i1.timeState, 'after', `${w}x${h} the recess time is substituted`);
  }
});
