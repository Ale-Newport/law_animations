// Hearings · Lectura de resolución (LAW-0317..0320): DOM-less sweep. Every preset (and the defaults, and an es-only
// render) × 16:9 / 9:16 / 1:1 × labels shown / hidden evaluates without a DOM, without throwing, at the rest, mid and
// hold, and deterministically; then the motif's own facts (separation, contrast difference, substitution).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
for (const id of ['LAW-0317', 'LAW-0318', 'LAW-0319', 'LAW-0320']) {
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

// The story separates the document and links both sections at the same pace; the contrast links only the laid-out
// section in each room; the inspect entry substitutes one paragraph of A and moves nothing of B (DOM-less).
test('lectura-resolucion: story separation, contrast difference and inspect substitution (DOM-less)', async () => {
  const load = async id => (await import(pathToFileURL(path.join(root, `src/animations/hearings/${id}.js`)).href)).default;
  const story = await load('LAW-0317'), contrast = await load('LAW-0319'), inspect = await load('LAW-0320');
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const s0 = story.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    const s = story.evaluate({params: {}, width: w, height: h, timeMs: story.defaultParams.durationMs}).semantic;
    assert.equal(s0.docState, 'lectern', `${w}x${h} the document starts on the lectern`);
    assert.equal(s.docState, 'separated', `${w}x${h} story separated`);
    assert.equal(s.linkState, 'linked', `${w}x${h} story linked`);
    assert.deepEqual(s.drawA, s.drawB, `${w}x${h} same pace`);
    assert.deepEqual(s.positions, s0.positions, `${w}x${h} positions kept`);
    const c = contrast.evaluate({params: {}, width: w, height: h, timeMs: contrast.defaultParams.durationMs}).semantic;
    assert.equal(c.linkStateA, 'linked', `${w}x${h} A linked`);
    assert.equal(c.linkStateB, 'linked', `${w}x${h} B linked`);
    assert.ok(c.offA.every(q => q === 0) && c.offB.every(q => q === 0), `${w}x${h} only the laid-out section is linked`);
    assert.equal(c.lookA, c.lookB, `${w}x${h} everything else identical`);
    const i0 = inspect.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    const i1 = inspect.evaluate({params: {}, width: w, height: h, timeMs: inspect.defaultParams.durationMs}).semantic;
    assert.equal(i0.linkState, 'before', `${w}x${h} before`);
    assert.equal(i1.linkState, 'after', `${w}x${h} the paragraph is substituted`);
    assert.deepEqual(i1.tipsB, i0.tipsB, `${w}x${h} B never moves`);
  }
});

// No English in the Spanish defaults (data level; the rendered es-only check is esDefaultsTest in each entry's test): the
// kit's es defaults and every baseline-es preset.
test('lectura-resolucion: the es defaults contain no English words', async () => {
  const words = /\b(Reader|Participant|Paragraph|Paragraphs|Room|fictional|supplied|Grounds|Operative|board|lectern|table|clock|configured|conclusion|Changed|section|document|Read|Neither|The|On|In|the|and|was)\b/;
  const kit = await import(pathToFileURL(path.join(root, 'src/animations/hearings/kits/lectura-resolucion.js')).href);
  const bad = [];
  // (enum ids — element ids, relationship ends, note targets, traversal steps — are not text)
  const ENUM = new Set(['id', 'from', 'to', 'target', 'traversalOrder', 'side', 'focusElement', 'focusTarget', 'kind', 'locale', 'placement', 'finalState']);
  const walk = (v, p) => { const key = p.split('.').filter(q => !/^\d+$/.test(q)).pop(); if (ENUM.has(key)) return; if (typeof v === 'string') { if (words.test(v)) bad.push(`${p}: ${v}`); } else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${p}.${k}`); };
  walk(kit.LR_ES, 'LR_ES');
  for (const id of ['LAW-0317', 'LAW-0318', 'LAW-0319', 'LAW-0320']) {
    const pr = JSON.parse(fs.readFileSync(path.join(root, `src/animations/hearings/${id}.presets.json`), 'utf8')).presets.find(q => q.name === 'baseline-es');
    walk(pr.params, `${id} baseline-es`);
  }
  assert.deepEqual(bad, []);
});
