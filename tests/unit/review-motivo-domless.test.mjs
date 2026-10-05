// Review · Identificación de motivo (LAW-0321..0324, hearings-11): DOM-less sweep. Every preset (and the defaults, and an
// es-only render) × 16:9 / 9:16 / 1:1 × labels shown / hidden evaluates without a DOM, without throwing, at the rest, mid
// and hold, and deterministically; then the motif's own facts (located and linked, contrast difference, substitution).
// (copied from ./hearings-reading-domless.test.mjs and adapted; that file stays unchanged)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IDS = ['LAW-0321', 'LAW-0322', 'LAW-0323', 'LAW-0324'];
for (const id of IDS) {
  test(`${id}: DOM-less sweep — every preset × ratio × labels state evaluates (no throw, deterministic)`, async () => {
    const def = (await import(pathToFileURL(path.join(root, `src/animations/review/${id}.js`)).href)).default;
    const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...JSON.parse(fs.readFileSync(path.join(root, `src/animations/review/${id}.presets.json`), 'utf8')).presets];
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

// The story locates and links both labels at the same pace and returns the party to its place; the contrast links only
// the room's own label to the same located apartados; the inspect entry substitutes label A's apartado and moves nothing
// of B (DOM-less).
test('identificacion-motivo: story location, contrast difference and inspect substitution (DOM-less)', async () => {
  const load = async id => (await import(pathToFileURL(path.join(root, `src/animations/review/${id}.js`)).href)).default;
  const story = await load('LAW-0321'), contrast = await load('LAW-0323'), inspect = await load('LAW-0324');
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const s0 = story.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    const s = story.evaluate({params: {}, width: w, height: h, timeMs: story.defaultParams.durationMs}).semantic;
    assert.equal(s0.lupaPhase, 'rest', `${w}x${h} the magnifier starts at rest`);
    assert.equal(s.lupaPhase, 'laid', `${w}x${h} the magnifier laid back`);
    assert.ok(s.locK.every(q => q === 1), `${w}x${h} every supplied apartado located`);
    assert.equal(s.linkState, 'linked', `${w}x${h} story linked`);
    assert.deepEqual(s.drawA, s.drawB, `${w}x${h} same pace`);
    assert.deepEqual(s.party, s0.party, `${w}x${h} the party back at its place`);
    const c = contrast.evaluate({params: {}, width: w, height: h, timeMs: contrast.defaultParams.durationMs}).semantic;
    assert.equal(c.linkStateA, 'linked', `${w}x${h} A linked`);
    assert.equal(c.linkStateB, 'linked', `${w}x${h} B linked`);
    assert.ok(c.offA.every(q => q === 0) && c.offB.every(q => q === 0), `${w}x${h} only the room's own label is linked`);
    assert.deepEqual(c.linksA, c.linksB, `${w}x${h} the same located apartados`);
    assert.equal(c.lookA, c.lookB, `${w}x${h} everything else identical`);
    const i0 = inspect.evaluate({params: {}, width: w, height: h, timeMs: 0}).semantic;
    const i1 = inspect.evaluate({params: {}, width: w, height: h, timeMs: inspect.defaultParams.durationMs}).semantic;
    assert.equal(i0.linkState, 'before', `${w}x${h} before`);
    assert.equal(i1.linkState, 'after', `${w}x${h} label A's apartado substituted`);
    assert.deepEqual(i1.tipsB, i0.tipsB, `${w}x${h} B never moves`);
  }
});

// No English in the Spanish defaults (data level; the rendered es-only check is esDefaultsTest in each entry's test): the
// kit's es defaults and every baseline-es preset; and natural Spanish agreement in the motif's own words.
test('identificacion-motivo: the es defaults contain no English words', async () => {
  const words = /\b(Party|Participant|Section|Sections|section|Decision|decision|fictional|supplied|Factual|discrepancy|Legal|question|raised|Labelled|label|Label|magnifier|board|table|calendar|configured|conclusion|Changed|Located|located|Card|The|On|In|the|and|was|with)\b/;
  const kit = await import(pathToFileURL(path.join(root, 'src/animations/review/kits/identificacion-motivo.js')).href);
  const bad = [];
  // (enum ids — element ids, relationship ends, note targets, traversal steps — are not text)
  const ENUM = new Set(['id', 'from', 'to', 'target', 'traversalOrder', 'side', 'focusElement', 'focusTarget', 'kind', 'locale', 'placement', 'finalState']);
  const walk = (v, p) => { const key = p.split('.').filter(q => !/^\d+$/.test(q)).pop(); if (ENUM.has(key)) return; if (typeof v === 'string') { if (words.test(v)) bad.push(`${p}: ${v}`); } else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${p}.${k}`); };
  walk(kit.IM_ES, 'IM_ES');
  for (const id of IDS) {
    const pr = JSON.parse(fs.readFileSync(path.join(root, `src/animations/review/${id}.presets.json`), 'utf8')).presets.find(q => q.name === 'baseline-es');
    walk(pr.params, `${id} baseline-es`);
  }
  assert.deepEqual(bad, []);
  // (agreement: "cuestión jurídica señalada" is feminine; "etiqueta" takes feminine adjectives)
  const all = JSON.stringify(kit.IM_ES);
  assert.ok(!/cuestión jurídica señalado/.test(all) && !/etiqueta \w+ado\b/i.test(all), 'Spanish agreement in the defaults');
});
