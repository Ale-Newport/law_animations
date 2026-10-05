// Node unit tests (no DOM): import boundary, schema behaviour and pure
// evaluation determinism for every implemented module.
// Run: node --test tests/unit/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {validate, applyPatch, ParamError, buildParamsSchema} from '../../src/core/schema.js';
import {rand} from '../../src/core/random.js';
import {seg, track, r} from '../../src/core/time.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = fs.readFileSync(path.join(root, 'briefs/catalog.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const implemented = catalog.filter(e => fs.existsSync(path.join(root, e.output.module)));

test('no DOM globals are present in this Node process', () => {
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof globalThis.window, 'undefined');
});

test('schema: arrays replace, objects merge, unsafe and unknown keys are rejected', () => {
  const schema = buildParamsSchema(6000, {
    list: {type: 'array', items: {type: 'string'}, maxItems: 3},
    box: {type: 'object', additionalProperties: false, properties: {a: {type: 'string'}, b: {type: 'string'}}},
  });
  const base = {list: ['x', 'y'], box: {a: '1', b: '2'}};
  const out = applyPatch(base, {list: ['z'], box: {b: '3'}}, schema);
  assert.deepEqual(out.list, ['z']);
  assert.deepEqual(out.box, {a: '1', b: '3'});
  assert.deepEqual(base.list, ['x', 'y'], 'input not mutated');
  assert.throws(() => applyPatch(base, JSON.parse('{"__proto__": {"p": 1}}'), schema), ParamError);
  assert.throws(() => applyPatch(base, {nope: 1}, schema), ParamError);
  assert.ok(validate(schema, {list: ['a', 'b', 'c', 'd']}).length > 0, 'maxItems enforced');
  assert.ok(validate(schema.properties.durationMs, -1).length > 0, 'duration minimum enforced');
});

test('random: stateless and order-independent', () => {
  const a = [rand(7, 'k', 0), rand(7, 'k', 1), rand(7, 'j', 0)];
  const b = [rand(7, 'j', 0), rand(7, 'k', 1), rand(7, 'k', 0)].reverse();
  assert.deepEqual(a, [b[0], b[1], b[2]]);
  assert.notEqual(rand(7, 'k'), rand(8, 'k'));
});

test('time helpers are pure and clamped', () => {
  assert.equal(seg(-1, 0, 1), 0);
  assert.equal(seg(2, 0, 1), 1);
  assert.equal(track(0.5, [[0, 0], [1, 10]]), 5);
  assert.equal(r(-0.0001), 0);
  assert.throws(() => r(NaN));
});

for (const e of implemented) {
  test(`${e.id}: imports without a DOM and evaluates deterministically`, async () => {
    const mod = await import(pathToFileURL(path.join(root, e.output.module)).href);
    const def = mod.default;
    assert.equal(def.id, e.id);
    assert.equal(typeof def.create, 'function');
    assert.equal(def.metadata.content.legalStatus, 'illustrative-unverified');
    const D = def.defaultParams.durationMs;
    const times = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map(u => u * D);
    const forward = times.map(t => JSON.stringify(def.evaluate({timeMs: t})));
    const backward = times.slice().reverse().map(t => JSON.stringify(def.evaluate({timeMs: t}))).reverse();
    assert.deepEqual(forward, backward);
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({width: w, height: h, timeMs: D * 0.6});
      assert.ok(Object.keys(s.nodes).length > 0);
    }
    const presets = JSON.parse(fs.readFileSync(path.join(root, e.output.presets), 'utf8')).presets;
    for (const name of e.requiredPresets) assert.ok(presets.some(p => p.name === name), `preset ${name}`);
    for (const p of presets) assert.doesNotThrow(() => def.evaluate({params: p.params, timeMs: D / 2}), `preset ${p.name} validates`);
  });
}
