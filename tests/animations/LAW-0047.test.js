// LAW-0047 — Cita localizada · contrast. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

contractSuite('LAW-0047', {
  continuity: ['bookA', 'bookB', 'handLA', 'handLB', 'handRA', 'handRB', 'cardA', 'cardB', 'tokParaA'],
  semantic: [
    {at: 0.1, fn: "s.written === 0 && s.a.split === 0 && s.b.split === 0 && s.a.holder === s.b.holder && JSON.stringify(s.cardA) === JSON.stringify(s.cardB)", label: 'identical base situation: the changed part is not shown yet'},
    {at: 0.34, fn: "s.written === 1 && s.b.missing.includes('paragraph') && s.a.missing.length === 0", label: 'the changed fact is introduced: A gives the pinpoint, B does not'},
    {at: 0.6, fn: 's.sameBookPath && s.a.holder === s.b.holder', label: 'the same volume moves identically in both scenes'},
    {at: 1, fn: "s.a.highlight === 1 && s.b.highlight === 0 && s.a.open === 1 && s.b.open === 1 && s.a.landed.page && s.b.landed.page", label: 'both open the same page; only A marks a paragraph'},
    {at: 1, fn: "!s.b.landed.paragraph && s.depthA === 4 && s.depthB === 3", label: 'B stops where its reference stops (no paragraph invented)'},
    {at: 1, fn: 's.guideProgress === 1 && s.calloutShown', label: 'comparison guide and the enlarged slot callout are shown at the end'},
    {at: 0.7, fn: '!s.calloutShown && s.guideProgress === 0', label: 'the guide does not appear before the parallel action is complete'},
    {at: 0, fn: 's.armROutA === 1 && s.armROutB === 1', label: 'rest: both right hands are still off-stage (no clipped hands in a corner)'},
    {at: 1, fn: 's.armROutA === 1 && s.armROutB === 1', label: 'the right hands have left once the cards are laid down (the guide crosses no hand)'},
    {at: 1, fn: '!s.paraTagOverCard', label: "A's docked paragraph tag leaves the resting card uncovered"},
    {at: 1, params: {missingPart: 'page'}, fn: "s.b.open === 0 && s.b.holder === 'board' && s.a.open === 1 && s.depthB === 2 && s.b.missing.includes('page') && s.b.missing.includes('paragraph')", label: 'reference stopping before the page: B retrieves the volume but does not open it'},
  ],
});

// Real frame sizes (the semantic battery above runs at 1920×1080 only).
// Every preset × 16:9/9:16/1:1: A's docked paragraph tag never covers the
// resting card. Long labels at 9:16: a tall tag at a low row no longer sends
// the card to the high place in the tag's flight lane, so the flying tag never
// crosses the card either (reviewer round 3 follow-up).
test('LAW-0047: paragraph tag clear of the resting card (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0047');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0047');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `tag-${rows.length}`, params: pr.params});
        await x.ready;
        const sweep = pr.name === 'long-labels-stress' && ratio === '9:16';
        const hits = [];
        for (let u = sweep ? 0.49 : 1; u <= 1.0001; u += 0.005) {
          x.seek(u * x.durationMs);
          if (x.getState({bounds: false}).semantic.paraTagOverCard) hits.push(Number(u.toFixed(3)));
        }
        rows.push({preset: pr.name, ratio, hits});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  const bad = out.filter(q => q.hits.length);
  expect(bad, JSON.stringify(out)).toEqual([]);
});
