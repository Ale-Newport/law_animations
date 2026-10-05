// LAW-0106 — Razonamiento circular · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its own element (while the parts separate, while the focus part
// is enlarged and while they gather), the visiting order does not change when seeking (determinism + the
// order equals the supplied traversal), and a relation is never drawn as causation by default.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {midWordSuite, everyLayoutSuite} from './razonamiento-circular-checks.js';

const ID = 'LAW-0106';
const ENDS = 's.linkEnds.every(Boolean)';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.explode === 0 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.packedGap >= 9 && s.badge === 0", label: 'start: the parts form one tight cluster (touching gaps, no overlap), no link, no marker'},
    {at: 0.18, fn: 's.explode === 1 && s.separated > 80 && s.relationsDrawn.every(p => p === 0)', label: 'separate: every part is apart from the others before any link is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'links are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.3, fn: ENDS, label: 'links being drawn start and end on their own parts'},
    {at: 0.44, fn: `s.relationsDrawn.every(p => p === 1) && ${ENDS} && s.linkLengths.every(v => v > 60)`, label: 'all supplied links drawn, each from its own part to its own part, readable length'},
    {at: 0.44, fn: "JSON.stringify(s.cycleLinks) === JSON.stringify([0, 1]) && s.cycleParts.includes('premise') && s.cycleParts.includes('claim') && s.badge === 1", label: 'the supplied premise ⇄ claim links are found as a cycle (ring + loop badge), nothing else'},
    {at: 1, fn: "s.causalCount === 0 && JSON.stringify(s.arrowheads) === JSON.stringify([true, true, true, false, false])", label: 'relations carry no arrowhead and nothing is causal by default'},
    {at: 0.6, fn: "s.tracerVisible && s.visited.length >= 2 && JSON.stringify(s.visited) === JSON.stringify(s.visitOrder.slice(0, s.visited.length))", label: 'the marker visits the parts in the supplied order'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['premise', 'claim', 'premise', 'claim', 'external', 'support'])", label: 'the route goes round the ring back to the premise, then out to the outside support'},
    {at: 0.5, fn: `${ENDS} && !s.overlaps`, label: 'during the trace links stay attached and no part overlaps another'},
    {at: 1, fn: "!s.tracerVisible && s.focusScale === 1 && s.gather === 1 && " + ENDS + " && !s.overlaps", label: 'gather: parts pulled together, links still attached, no overlap'},
    {at: 1, fn: "Object.keys(s.centres).every(id => true) && s.separated > 60", label: 'gather keeps every link readable (parts keep a gap)'},
    {at: 1, params: {relationships: [{from: 'premise', to: 'claim', kind: 'causal'}, {from: 'rule', to: 'claim', kind: 'relation'}]}, fn: "s.causalCount === 1 && s.arrowheads[0] === true && s.arrowheads[1] === false && s.cycleLinks.length === 0 && s.badge === 0 && " + ENDS, label: 'a causal style appears only when the author supplies it; no cycle → no loop badge'},
    {at: 0.6, params: {traversalOrder: ['support', 'external', 'claim']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['support', 'external', 'claim'])", label: 'the marker follows a different supplied traversal order'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.badge === 1 && ' + ENDS, label: 'labels hidden: the same mechanism, cycle and links read'},
  ],
});

// The focus part swells while the marker passes it and its links stay on its (enlarged) edges.
test(`${ID}: focus part enlarged while the marker is on it; links attached (all presets × ratios)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const rows = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs * 0.6);
      const s0 = x.getState({bounds: false}).semantic;
      let peak = 1, ends = true, overlap = false;
      if (s0.focusU !== null) {
        x.seek(x.durationMs * s0.focusU);
        const s = x.getState({bounds: false}).semantic;
        peak = s.focusScale; ends = s.linkEnds.every(Boolean); overlap = s.overlaps;
      }
      x.seek(x.durationMs * 0.44);
      const lc44 = x.getState({bounds: false}).semantic.linksClear;
      x.seek(x.durationMs * 0.85);
      const clear85 = x.getState({bounds: false}).semantic.labelsClear;
      x.seek(x.durationMs);
      const clear = x.getState({bounds: false}).semantic.labelsClear && clear85;
      const linksClear = lc44 && x.getState({bounds: false}).semantic.linksClear;
      rows.push({preset: pr.name, ratio, peak, ends, overlap, clear, linksClear});
      x.destroy(); el.remove();
    }
    return rows;
  }, [ID, presets]);
  for (const r of out) {
    expect.soft(r.peak, `${r.preset} ${r.ratio}: focus scale when reached`).toBeGreaterThan(1.1);
    expect.soft(r.ends, `${r.preset} ${r.ratio}: links on the enlarged edges`).toBe(true);
    expect.soft(r.overlap, `${r.preset} ${r.ratio}: enlarged part overlaps another`).toBe(false);
    expect.soft(r.clear, `${r.preset} ${r.ratio}: key / tag / footnote / issue off every part during the gather and hold`).toBe(true);
    expect.soft(r.linksClear, `${r.preset} ${r.ratio}: no link runs across a part it does not connect`).toBe(true);
  }
});


// Rendered text audit (shared harness): every supplied field drawn un-truncated at the hold; supplied text
// >= 16 px (>= 19.5 px baseline) and never smaller than the generic captions; the no-conclusion key.
const FIELDS = 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, ...p.issues, ...p.assumptions, p.speaker.name, p.speaker.role, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(r => p.relationLabels[r.kind] || r.kind))]]';
suppliedTextSuite(ID, {fields: FIELDS, content: 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, p.speaker.name]', captions: 'return [...new Set(p.relationships.map(r => p.relationLabels[r.kind] || r.kind)), ...p.issues, ...p.assumptions]'});
midWordSuite(ID, FIELDS, {strictHyphen: true});

// Review fixes (0106, items 5, 7, 12, 16): links keep clear of the parts they do not join and never cross each
// other (ring twins excepted); no two link ends share a spot on a part (no arrowhead lands where another link
// starts); the enlarged focus part stays inside the board; the magnifier never lies over a card while it
// traces; no link runs under a note.
const TRACE = [0.46, 0.5, 0.55, 0.6, 0.65, 0.7, 0.74];
everyLayoutSuite(ID, 'links clear of other parts, uncrossed, with distinct ends',
  's.linkClearance >= 10 && s.linkCrossings === 0 && s.linkEndGap >= 30', {at: [0.44, 0.6, 1], visibility: ['all', 'none']});
everyLayoutSuite(ID, 'the enlarged focus part stays inside the board', 's.focusInStage', {at: TRACE, visibility: ['all', 'none']});
everyLayoutSuite(ID, 'the magnifier never covers a card while it traces', 's.glassClear', {at: TRACE, visibility: ['all', 'none']});
everyLayoutSuite(ID, 'no link runs under a note', 's.notesClearOfLinks', {at: [0.5, 1]});
