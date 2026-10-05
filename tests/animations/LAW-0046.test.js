// LAW-0046 — Cita localizada · mechanism. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

// long-labels-stress preset parameters (relation captions that wrap to two lines)
const LONG = {"query": "Consolidated Casebook of Illustrative Examples for Teaching, vol. 14, p. 1127, para. 23", "sources": ["Journal of Sample Studies in Comparative Procedure", "Consolidated Casebook of Illustrative Examples", "Practice Notes and Commentary"], "citations": [{"source": "Consolidated Casebook of Illustrative Examples", "volume": "Volume 14 (second part)", "page": "page 1127", "paragraph": "paragraph 23"}], "dates": ["Noted on day 12 (log)", "Edition of day 3 (fictional)"], "pinpointRow": 4, "elements": [{"id": "card", "label": "Index card with the reference as noted"}, {"id": "search", "label": "Library catalogue search terminal"}, {"id": "library", "label": "Shelf of the consolidated casebook"}, {"id": "volume", "label": "Volume fourteen, second part"}, {"id": "page", "label": "Page eleven hundred twenty-seven"}, {"id": "paragraph", "label": "The pinpointed paragraph on that page"}], "relationships": [{"from": "card", "to": "search", "kind": "communication", "label": "reference entered as a search query"}, {"from": "search", "to": "library", "kind": "sequence", "label": "source part leads to the shelf"}, {"from": "library", "to": "volume", "kind": "relation", "label": "shelf holds the volume"}, {"from": "volume", "to": "page", "kind": "sequence", "label": "volume opens at the page"}, {"from": "page", "to": "paragraph", "kind": "sequence", "label": "pinpoint leads to the paragraph"}], "relationLabels": {"relation": "plain relation (no direction)", "communication": "communication between parts", "sequence": "sequence of steps", "causal": "causal link (only when supplied)"}};
const ORDER = "['card','search','library','volume','page','paragraph']";

contractSuite('LAW-0046', {
  continuity: ['tracer', 'strip', 'lvLibrary', 'lvVolume', 'lvPage', 'lvParagraph', 'tokSource', 'tokVolume', 'tokPage', 'tokPara'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.split === 0 && s.relationsDrawn.every(p => p === 0) && Object.values(s.located).every(v => v === 0)', label: 'starts with the reference whole, no relations and nothing located'},
    {at: 0.2, fn: 's.split === 1 && s.relationsDrawn.every(p => p < 1)', label: 'the reference is split into its parts before relations are drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && s.located.paragraph === 0', label: 'all relations drawn before the tracer runs; paragraph not yet marked'},
    {at: 1, fn: 's.connectorsLand', label: 'every connector ends on its element'},
    {at: 1, fn: 's.relLabelsClear', label: 'relation captions touch no other connector and leave both ends of their own connector visible'},
    {at: 1, params: LONG, fn: 's.relLabelsClear && s.connectorsLand', label: 'long captions: still clear of every other connector, own connector ends visible'},
    {at: 1, fn: 's.annotationClashes.length === 0', label: 'held annotations never touch and no connector runs through one (arrowheads visible)'},
    {at: 1, params: LONG, fn: 's.annotationClashes.length === 0', label: 'long labels: held annotations never touch and no connector runs through one'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.arrowOnRelation === false", label: 'plain relations are not drawn as causation by default'},
    {at: 1, fn: 'Object.values(s.located).every(v => v === 1) && s.highlight === 1 && !s.tracerVisible', label: 'ends with every location marked and the paragraph highlighted'},
    {at: 0.25, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${ORDER})`, label: 'traversal order is fixed before the trace (seek-independent)'},
    {at: 0.9, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${ORDER})`, label: 'traversal order unchanged after the trace'},
    {at: 0.6, params: {traversalOrder: ['paragraph', 'page', 'volume']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['paragraph','page','volume'])", label: 'tracer follows the supplied traversal order'},
    {at: 1, params: {citations: [{source: 'Casebook of Examples', volume: 'Vol. 4', page: 'p. 112', paragraph: ''}]}, fn: "s.highlight === 0 && s.located.paragraph === 0 && s.located.page === 1 && s.missing.includes('paragraph')", label: 'incomplete reference: the paragraph is not marked'},
  ],
});

// Real frame sizes (the semantic battery above runs at 1920×1080 only): for
// every preset × 16:9/9:16/1:1 the held layout keeps its annotations (labels,
// state tag, pinpoint chip, marks, legend, relation captions) apart, no
// connector runs through one (so every arrowhead stays visible) and every
// connector still lands on its element — reviewer fix (9:16 / 1:1 long labels).
test('LAW-0046: held annotations and connectors clear (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0046');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0046');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `clear-${rows.length}`, params: pr.params});
        await x.ready;
        x.seek(x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        rows.push({preset: pr.name, ratio, clashes: s.annotationClashes, land: s.connectorsLand, labels: s.relLabelsClear});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  const bad = out.filter(q => q.clashes.length || !q.land || !q.labels);
  expect(bad, JSON.stringify(out, null, 1)).toEqual([]);
});
