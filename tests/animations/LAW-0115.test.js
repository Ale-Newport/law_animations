// LAW-0115 — Hecho contrafactual · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated circumstance changes
// (only B's flag moves; both takes then run with identical timing and differ
// only where that spot differs), and no legal consequence is invented (no
// winner, score or outcome; the hypothetical's outcome is "not supplied").
// Review round 2: each scene keeps ≥ 40 % of the safe width side by side and near full width when
// stacked (AUTHORING item 18); the shared text is drawn once as a compact strip; the relation lands on
// the condition row; nothing overlaps; timing per item 19 (main action by ~u 0.8, ≥ 300 ms fully visible).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';

contractSuite('LAW-0115', {
  continuity: ['figA', 'figB', 'parcelA', 'parcelB', 'flagB'],
  semantic: [
    {at: 0, fn: "s.scenes === 2 && s.identical && s.flagSpotA === 'bench' && s.flagSpotB === 'bench' && s.lookA.labels === 0", label: 'base: two identical complete scenes (flag on the same spot, neutral badges, no labels)'},
    {at: 0.16, fn: 's.identical && s.hop === 0 && s.lookA.badgeColour === 0 && s.lookB.badgeColour === 0', label: 'base: still identical at the end of the base beat (no colour, label or flag move yet)'},
    {at: 0.26, fn: "!s.identical && s.hop > 0 && s.hop < 1 && s.lookA.fig === s.lookB.fig && s.lookA.parcel.x === s.lookB.parcel.x", label: 'change: only B’s flag is moving; everything else identical'},
    {at: 0.38, fn: "s.flagSpotA === 'bench' && s.flagSpotB === 'sill' && s.differingCircumstances === 1 && s.lookA.labels === 1 && s.tau === 0", label: 'change: B’s flag lands on the other spot; headers named; nothing has run yet'},
    {at: 0.47, fn: 's.figXA === s.figXB && s.figXA > 112 && s.lookA.parcel.y === s.lookB.parcel.y', label: 'parallel: both figurines walk in lockstep (same timing)'},
    {at: 0.64, fn: "s.parcelSpotB === 'sill' && s.parcelSpotA === null && s.figXA > s.figXB", label: 'parallel: B has left its parcel at its own spot while A still walks on (sequence differs)'},
    {at: 0.77, fn: "s.parcelSpotA === 'bench' && s.parcelSpotB === 'sill' && s.guide === 0", label: 'end of the takes: each parcel at its own flagged spot; guide not yet drawn'},
    {at: 1, fn: "s.guide === 1 && s.relation.kind === 'relation' && s.relation.drawn === 1 && s.relation.condition === 1", label: 'guide: the two spots are joined; the changed fact is related to the supplied condition'},
    {at: 1, fn: "s.notes.some(n => n.includes('Where the parcel is left')) && s.notes.some(n => n.includes('no winner')) && s.notes.some(n => n.includes('not supplied')) && s.notes.some(n => n.includes('window sill ever agreed')) && s.notes.some(n => n.includes('Everything else'))", label: 'guide: changed fact, neutral note, key, issue and assumption drawn'},
    {at: 1, fn: "s.outcome === 'not-supplied' && s.winner === null && s.score === null", label: 'no winner, score or outcome is produced'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.parcelSpotA === 'bench' && s.parcelSpotB === 'sill' && s.guide > 0", label: 'labels hidden: the same contrast completes'},
    {at: 0.1, params: {textVisibility: 'none'}, fn: 's.identical', label: 'labels hidden: identical before the change beat'},
    {at: 1, params: {spots: {a: 'box', b: 'bench'}}, fn: "s.parcelSpotA === 'box' && s.parcelSpotB === 'bench' && s.flagSpotB === 'bench'", label: 'another supplied pair of spots is followed as given'},
    {at: 1, fn: '(1 - s.complete) * 7500 >= 300 && s.complete <= 0.9', label: 'timing: everything complete by u 0.9 and fully visible for ≥ 300 ms'},
    {at: 0.8, fn: "s.parcelSpotA === 'bench' && s.parcelSpotB === 'sill' && s.flagSpotB === 'sill'", label: 'timing: the main action (flag hop and both takes) is done by u 0.8'},
    {at: 1, fn: 'Math.hypot(s.relEnds.to.x - s.relEnds.anchorR.x, s.relEnds.to.y - s.relEnds.anchorR.y) < 1 || Math.hypot(s.relEnds.to.x - s.relEnds.anchorL.x, s.relEnds.to.y - s.relEnds.anchorL.y) < 1', label: 'the relation ends on the supplied condition row'},
    {at: 1, params: {spots: {a: 'sill', b: 'sill'}}, fn: "s.differingCircumstances === 0 && s.parcelSpotA === 'sill' && s.parcelSpotB === 'sill' && s.figXA === s.figXB", label: 'identical supplied spots give identical scenes (nothing invented)'},
  ],
});

identicalBeforeChange('LAW-0115', 0.17);

suppliedTextSuite('LAW-0115', {
  fields: 'return [p.facts.title, ...p.facts.events, p.rules.title, ...p.rules.conditions, ...p.issues, ...p.assumptions, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  content: 'return [...p.facts.events, ...p.rules.conditions, ...p.issues, ...p.assumptions, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts];',
  captions: 'return [p.comparisonLabels.guide];',
});

// Real-ratio audit (every preset × 16:9/9:16/1:1 × labels shown/hidden) at the hold:
//  - AUTHORING item 18: side by side each scene spans ≥ 40 % of the safe width; stacked ≥ 80 %;
//  - scenes, headers, the guide label, the shared strip and the notes never overlap and stay inside the frame.
test('LAW-0115: scene share and a clean layout (all presets × ratios × labels)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0115')];
  const out = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0115');
    const ov = (a, b) => a.x < b.x + b.w - 1 && a.x + a.w - 1 > b.x && a.y < b.y + b.h - 1 && a.y + a.h - 1 > b.y;
    const bad = [];
    const shares = [];
    let n = 0;
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      n++;
      const tag = `${pr.name} ${tv} ${ratio}`;
      shares.push([tag, s.sceneShare, s.textPx]);
      if (s.sceneShare < (s.stacked ? 0.8 : 0.4)) bad.push(`${tag}: scene share ${s.sceneShare}`);
      if (s.stacked !== (ratio === '9:16')) bad.push(`${tag}: stacked=${s.stacked}`);
      const boxes = Object.entries(s.boxes);
      for (const [k, b] of boxes) if (b.x < -1 || b.y < -1 || b.x + b.w > s.design.w + 1 || b.y + b.h > s.design.h + 1) bad.push(`${tag}: ${k} outside the frame`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (ov(boxes[i][1], boxes[j][1])) bad.push(`${tag}: ${boxes[i][0]} overlaps ${boxes[j][0]}`);
      x.destroy();
      el.remove();
    }
    return {bad, n, shares};
  }, presets);
  console.log(JSON.stringify(out.shares));
  expect(out.n).toBe(30);
  expect(out.bad).toEqual([]);
});
