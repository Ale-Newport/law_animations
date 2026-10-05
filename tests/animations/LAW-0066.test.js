// LAW-0066 — Extracción de hechos · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its part, the visiting order does not change
// with seeking, and a plain relation is never drawn as causation by default. Review round 3:
// connectors do not cross, are long enough to read, and the travelling copy stays rolled.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

const ORDER = JSON.stringify(['query', 'marker', 'page', 'marker', 'card']);

contractSuite('LAW-0066', {
  continuity: ['tracer', 'packet'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && !s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.packet === null", label: 'starts with the parts separating, nothing related or traced'},
    {at: 0.18, fn: 's.relationsDrawn.every(p => p === 0)', label: 'parts are separated before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.435, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all supplied relations drawn before the tracer runs'},
    {at: 0.5, fn: 's.anchoredEnds', label: 'every connector starts and ends on the edge of its own part'},
    {at: 0.5, fn: "!s.relationKinds.includes('causal') && s.arrowheads === s.relationKinds.filter(k => k !== 'relation').length", label: 'no causal link unless supplied; plain relations have no arrowhead'},
    {at: 0.55, fn: `JSON.stringify(s.visitOrder) === '${ORDER}' && s.tracerVisible`, label: 'tracer follows the supplied traversal order'},
    {at: 0.95, fn: `JSON.stringify(s.visitOrder) === '${ORDER}'`, label: 'visiting order is the same after seeking elsewhere'},
    {at: 0.68, fn: 's.packet !== null && Math.hypot(s.packet.x - s.tracer.x, s.packet.y - s.tracer.y) < 0.5 && s.highlight === 1', label: 'the copy of the pinpointed sentence rides ON the connector with the tracer'},
    {at: 1, fn: "s.docked && s.highlight === 1 && !s.tracerVisible && s.pinpoint === 3 && s.visited.length === 5", label: 'gathered: origin highlighted, copy filed on the card, tracer gone'},
    {at: 0.5, fn: 's.connectorCrossings === 0 && s.shortestConnector >= 110', label: 'no two connectors cross and none is a stub hidden under its caption'},
    {at: 0.6, fn: 's.packet !== null && s.copyUnrolled === 0', label: 'the copy travels rolled (nothing laid over the page text or the card header)'},
    {at: 1, fn: 's.copyUnrolled === 1', label: 'the copy is unrolled in its slot for the hold'},
    {at: 0.6, params: {traversalOrder: ['card', 'marker', 'query']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['card','marker','query']) && s.packet === null", label: 'the tracer follows a supplied order (no page visit: nothing is copied)'},
    {at: 0.5, params: {relationships: [{from: 'marker', to: 'card', kind: 'causal', label: 'as supplied'}]}, fn: "s.relationKinds.length === 1 && s.relationKinds[0] === 'causal' && s.arrowheads === 1", label: 'a causal link appears only when supplied'},
  ],
});

// Real frame sizes (the semantic battery above runs at 1920×1080 only). Review round 7:
// every preset × 16:9/9:16/1:1 — no connector (line or end dot) runs under the page's label;
// on a condensed page (excerpt) the pinpointed sentence is simulated like its neighbours until
// the flag's ¶ link has reached it, and readable for the hold.
test('LAW-0066: page label clear of every connector; excerpt target hidden until pinpointed (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0066');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0066');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `lab-${rows.length}`, params: pr.params});
        await x.ready;
        const at = u => { x.seek(u * x.durationMs); return x.getState({bounds: false}).semantic; };
        const early = at(0.3), hold = at(1);
        rows.push({preset: pr.name, ratio, excerpt: hold.excerpt, clear: hold.pageLabelClear, early: early.targetText, hold: hold.targetText});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  const bad = out.filter(q => !q.clear || q.hold !== 1 || (q.excerpt && q.early !== 0));
  expect(bad, JSON.stringify(out)).toEqual([]);
});
