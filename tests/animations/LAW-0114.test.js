// LAW-0114 — Hecho contrafactual · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element (edge to edge), the
// traversal order does not change when seeking, and a relation is never drawn
// as causality by default (plain relations carry no arrowhead; a causal style
// appears only when the author supplies it).
// Review round 2: connectors land on their cards in every preset × ratio (gap ≤ 2 units), no link
// runs through another card, a note or a caption, every link keeps its caption (long labels wrap),
// the cels keep a large share of the frame, the magnifier is never clipped by the frame, and the
// timing follows AUTHORING item 19 (main action done by ~u 0.8, everything visible for the last ≥ 300 ms).
// Review round 3: the opening stack fills the safe box; captions are seated on their connectors.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

const ORDER = JSON.stringify(['set', 'events', 'spotA', 'rule', 'spotB']);

contractSuite('LAW-0114', {
  continuity: ['tracer', 'lens'],
  semantic: [
    {at: 0, fn: 's.assembled && s.bSwap === 0 && s.flagB === s.flagA && s.links.every(l => l.drawn === 0)', label: 'separate: the layers start registered as one diorama; cel B identical to cel A'},
    {at: 0.17, fn: 's.separated === 1 && s.bSwap === 0 && s.links.every(l => l.drawn === 0) && s.changedLayers.length === 0', label: 'separated: parts apart, nothing changed or linked yet'},
    {at: 0.27, fn: "s.bSwap === 1 && s.flagB === 'sill' && s.flagA === 'bench' && JSON.stringify(s.changedLayers) === JSON.stringify(['spotB'])", label: 'relate: only cel B changes (its flag moves to the hypothetical spot)'},
    {at: 0.43, fn: 's.links.every(l => l.drawn === 1)', label: 'relate: every supplied link is drawn by the end of the beat'},
    {at: 1, fn: 's.links.every(l => l.fromGap <= 2 && l.toGap <= 2)', label: 'every connector starts and ends on the edge of its own element (≤ 2 units)'},
    {at: 1, fn: 's.linkCrossings.length === 0', label: 'no link runs through another card, a note or another link’s caption'},
    {at: 1, fn: "s.links.filter(l => l.kind === 'relation').every(l => !l.arrow) && s.causalLinks === 0", label: 'plain relations have no arrowhead and no causal link is drawn by default'},
    {at: 1, fn: `JSON.stringify(s.visitOrder) === ${JSON.stringify(ORDER)}`, label: 'the tracer visits the elements in the supplied order'},
    {at: 0.3, fn: `JSON.stringify(s.visitOrder) === ${JSON.stringify(ORDER)} && s.visited.length === 0`, label: 'seeking back: same order, nothing visited before the trace beat'},
    {at: 0.6, fn: "s.tracerOn && s.visited[0] === 'set' && s.lensOverFocus && s.focus === 'spotB'", label: 'trace: the tracer runs the supplied order while the magnifier enlarges the focus element'},
    {at: 0.745, fn: "JSON.stringify(s.visited) === JSON.stringify(['set', 'events', 'spotA', 'rule', 'spotB'])", label: 'trace: every element in the order is visited by the end of the beat'},
    {at: 1, fn: "s.lensAway && s.ruleHighlighted === 1 && s.outcome === 'not-supplied' && s.winner === null", label: 'gather: magnifier put away, the related rule condition highlighted, outcome not supplied'},
    {at: 1, fn: "s.notes.some(n => n.includes('window sill ever agreed')) && s.notes.some(n => n.includes('Everything else happens')) && s.notes.some(n => n.includes('no conclusion drawn'))", label: 'gather: issue, assumption and key are drawn'},
    {at: 1, params: {relationships: [{from: 'events', to: 'spotB', kind: 'causal'}, {from: 'spotB', to: 'rule', kind: 'relation'}]}, fn: "s.causalLinks === 1 && s.links.find(l => l.kind === 'causal').arrow && s.links.length === 2", label: 'a causal link appears only when the author supplies it'},
    {at: 1, params: {traversalOrder: ['rule', 'spotB', 'events']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['rule', 'spotB', 'events'])", label: 'a different supplied order is followed as given'},
    {at: 0.6, params: {focusElement: 'events'}, fn: "s.focus === 'events' && s.lensOverFocus", label: 'the magnifier follows the supplied focus element'},
    {at: 0.43, params: {textVisibility: 'none'}, fn: "s.bSwap === 1 && s.flagB === 'sill' && s.links.every(l => l.drawn === 1)", label: 'labels hidden: the same swap and links happen'},
    // AUTHORING item 19 (recalibrated): the main action ends by ~u 0.8; the notes/key complete early enough
    // that everything is fully visible for at least the last 300 ms
    {at: 1, fn: '(1 - s.complete) * 7000 >= 300 && s.complete <= 0.9', label: 'timing: everything complete by u 0.9 and fully visible for ≥ 300 ms'},
    {at: 0.8, fn: 's.lensAway && !s.tracerOn && s.links.every(l => l.drawn === 1)', label: 'timing: the main action (links, trace, magnifier) is done by u 0.8'},
  ],
});

suppliedTextSuite('LAW-0114', {
  fields: 'const kinds = [...new Set(p.relationships.map(x => x.kind))]; return [...p.facts.events, p.rules.title, ...p.rules.conditions, p.circumstance.baseText, p.circumstance.altText, ...p.issues, ...p.assumptions, ...p.elements.map(e => e.label), ...kinds.map(k => p.relationLabels[k])];',
  content: 'return [...p.facts.events, ...p.rules.conditions, p.circumstance.baseText, p.circumstance.altText, ...p.issues, ...p.assumptions];',
  captions: 'const kinds = [...new Set(p.relationships.map(x => x.kind))]; return kinds.map(k => p.relationLabels[k]);',
});

// Real-ratio audit (every preset × 16:9/9:16/1:1 × labels shown/hidden):
//  - connectors land on their cards; no link crosses a card, a note or a caption; every link keeps its caption;
//  - parts, notes and captions never overlap at the hold;
//  - the cels keep a large share of the frame (AUTHORING item 18);
//  - the magnifier stays inside the frame while it enters, works and leaves.
test('LAW-0114: connectors, captions, cel share and magnifier (all presets × ratios × labels)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0114')];
  const out = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0114');
    const ov = (a, b) => a.x < b.x + b.w - 1 && a.x + a.w - 1 > b.x && a.y < b.y + b.h - 1 && a.y + a.h - 1 > b.y;
    const bad = [];
    const shares = [];
    let n = 0;
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      n++;
      const tag = `${pr.name} ${tv} ${ratio}`;
      for (const u of [0.4, 0.42, 0.44, 0.46, 0.6, 0.75, 0.77, 0.79]) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const b = s.lensBox;
        if (s.lensVisible && (b.x < 0 || b.y < 0 || b.x + b.w > s.design.w || b.y + b.h > s.design.h)) bad.push(`${tag} u${u}: magnifier clipped ${JSON.stringify(b)}`);
      }
      // review round 3: the opening frame is filled by the registered stack (≥ 80 % of the binding dimension)
      x.seek(0);
      const s0 = x.getState({bounds: false}).semantic;
      if (!s0.assembled || Math.min(s0.stackShare.w, s0.stackShare.h) < 0.3 || Math.max(s0.stackShare.w, s0.stackShare.h) < 0.8) bad.push(`${tag}: opening stack only ${JSON.stringify(s0.stackShare)}`);
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      // review round 3: every caption sits on (or touches) its connector, or has a visible leader to it
      s.captionSeats.forEach((c, ci) => { if (c.gap > 4 && !c.leader) bad.push(`${tag}: caption ${ci} floats ${c.gap} from its connector`); });
      for (const l of s.links) if (l.fromGap > 2 || l.toGap > 2) bad.push(`${tag}: link ${l.from}→${l.to} gaps ${l.fromGap}/${l.toGap}`);
      if (s.linkCrossings.length) bad.push(`${tag}: crossings ${s.linkCrossings.join(',')}`);
      if (tv === 'all' && !s.labelsPlaced) bad.push(`${tag}: a link lost its caption`);
      const boxes = [...Object.entries(s.boxes).map(([k, bb]) => [k, bb]), ...s.noteBoxes.map((bb, i) => [`note${i}`, bb]), ...s.labelBoxes.map((bb, i) => [`cap${i}`, bb])];
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (ov(boxes[i][1], boxes[j][1])) bad.push(`${tag}: ${boxes[i][0]} overlaps ${boxes[j][0]}`);
      shares.push([tag, s.celShare]);
      const floor = ratio === '16:9' ? 0.2 : 0.3;
      if (s.celShare < floor) bad.push(`${tag}: cel share ${s.celShare} < ${floor}`);
      x.destroy();
      el.remove();
    }
    return {bad, n, shares};
  }, presets);
  console.log(JSON.stringify(out.shares));
  expect(out.n).toBe(30);
  expect(out.bad).toEqual([]);
});
