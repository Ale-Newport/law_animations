// LAW-0083 — Hecho y regla · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes, and no
// legal consequence is invented to complete the contrast (only supplied states).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

contractSuite('LAW-0083', {
  continuity: ['cardA', 'cardB', 'lupaA', 'lupaB', 'tipA0', 'tipA1', 'tipA2', 'tipB0', 'tipB1', 'tipB2'],
  semantic: [
    {at: 0, fn: "s.scenes === 2 && !s.clipA.visible && !s.clipB.visible && s.slide === 0 && JSON.stringify(s.travelA) === JSON.stringify(s.travelB) && s.travelA.every(v => v === 0) && s.lupaAAtRest && s.lupaBAtRest", label: 'base: two identical scenes, no difference visible yet'},
    {at: 0.1, fn: 's.labelA === 0 && s.labelB === 0 && !s.clipA.visible && !s.clipB.visible', label: 'base: only neutral A/B badges; no scenario label, caption or colour before the change beat'},
    {at: 0.2, fn: 's.labelA === 0 && s.labelB === 0', label: 'change: labels still hidden until the marker lands on the changed row'},
    {at: 0.4, fn: 's.labelA === 1 && s.labelB === 1 && s.clipA.visible && s.clipB.visible', label: 'change: each lane’s label and caption appear together with its changed-row marker'},
    {at: 0.35, fn: "s.clipA.visible && s.clipA.kind === 'match' && s.clipB.visible && s.clipB.kind === 'dispute' && JSON.stringify(s.differingRows) === JSON.stringify([2]) && s.travelB.every(v => v === 0)", label: 'change: the same row gets its supplied marker in A and B; exactly one row differs'},
    {at: 0.5, fn: 's.slide > 0 && s.slide < 1 && s.cardA.y - s.cardB.y === s.cardA.y - s.cardB.y && JSON.stringify(s.travelA) === JSON.stringify(s.travelB)', label: 'parallel: both cards slide with identical timing'},
    {at: 0.62, fn: 's.docked && s.travelA[0] === s.travelB[0] && s.travelA[1] === s.travelB[1]', label: 'parallel: unchanged rows behave identically in A and B'},
    {at: 0.78, fn: 's.seatedA.every(v => v) && s.seatedB[0] && s.seatedB[1] && !s.seatedB[2] && s.shortB[2] && s.lupaBOverJoint && s.lupaAAtRest', label: 'A: every bolt seats; B: only the changed row stops short and only B’s magnifier moves (geometry and sequence differ)'},
    {at: 0.72, fn: 's.lupaBInGapColumn && s.lupaAInGapColumn && !s.lupaBAtRest && !s.lupaBOverJoint', label: 'B’s magnifier travels straight down the gap column (it never passes over a title or row text)'},
    {at: 0.72, params: {changedAttribute: 0}, fn: 's.lupaBInGapColumn', label: 'the drop follows the changed row’s gap column for any row'},
    {at: 1, fn: "s.guide === 1 && s.differingRows.length === 1 && JSON.stringify(s.statusesA) === JSON.stringify(['as-supplied', 'as-supplied', 'as-supplied']) && JSON.stringify(s.statusesB) === JSON.stringify(['as-supplied', 'as-supplied', 'disputed'])", label: 'guide: the changed row is joined; statuses exactly as supplied (no invented consequence)'},
    {at: 1, params: {statusB: 'pending'}, fn: "s.travelB[2] === 0 && !s.shortB[2] && s.clipB === null && s.lupaBOverJoint && s.seatedA[2]", label: 'B supplied as pending: its bolt stays retracted (no clip); A unchanged'},
    {at: 1, params: {changedAttribute: 0}, fn: "JSON.stringify(s.differingRows) === JSON.stringify([0]) && s.shortB[0] && s.seatedB[1] && s.seatedB[2]", label: 'a different changed attribute moves the difference to that row only'},
    {at: 1, params: {statusA: 'disputed', statusB: 'disputed'}, fn: 's.differingRows.length === 0 && s.shortA[2] && s.shortB[2]', label: 'identical supplied statuses give identical scenes (nothing invented)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.seatedA[2] && s.shortB[2] && s.lupaBOverJoint && s.clipA.visible && s.clipB.visible', label: 'labels hidden: the same physical difference reads'},
  ],
});

// Reviewer fix (round 2): before the change beat (t < 0.17) scenes A and B must look identical — same badges, no
// label/colour, no clip, same bolt looks (the changed row's bolt shows the shared look), same travel, marks and poses —
// in every preset × 16:9/9:16/1:1, with labels shown and hidden. Retracted bolts are clipped to their card.
test('LAW-0083: A and B are visually identical before the change beat (all presets × ratios × labels on/off)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0083')];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0083');
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
          const el = document.createElement('div');
          el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: `ab-${checked}`, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          for (const u of [0, 0.05, 0.1, 0.14, 0.169]) {
            x.seek(u * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            checked++;
            const a = JSON.stringify(s.lookA), b = JSON.stringify(s.lookB);
            if (!s.lookA || a !== b || !s.lookA.boltsClippedToCard) fails.push({preset: pr.name, tv, ratio, u, a, b});
          }
          x.destroy();
          el.remove();
        }
      }
    }
    return {fails, checked};
  }, presets);
  expect(out.checked).toBeGreaterThan(100);
  expect(out.fails.slice(0, 4)).toEqual([]);
});

// Coordinator decision (round 3): in the text-dense long-labels preset at 1:1 the rows (attributes and conditions)
// must stay readable — at least 16 px at 1080p — measured on the rendered <text> of every row, A's and B's cards and
// the rule plate (drawn once, shared by both lanes, when the doubled scenes cannot reach that size).
test('LAW-0083: long-labels 1:1 rows are at least 16 px at 1080p (rendered text)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const stress = presetsFor('LAW-0083').find(x => x.name === 'long-labels-stress').params;
  const out = await page.evaluate(async params => {
    const def = await window.__lib.load('LAW-0083');
    const el = document.createElement('div');
    el.style.cssText = 'width:540px;height:540px';
    document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1080, height: 1080, instanceId: 'rowpx', params});
    await x.ready;
    const res = [];
    for (const u of [0.3, 0.7, 1]) {
      x.seek(u * x.durationMs);
      const svg = el.querySelector('svg');
      const k = 1080 / svg.getBoundingClientRect().width;
      for (const n of svg.querySelectorAll('[data-node]')) {
        if (!/(crd-attr|plt-cond)\d$/.test(n.getAttribute('data-node'))) continue;
        for (const t of (n.tagName === 'text' ? [n] : n.querySelectorAll('text'))) {
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(t.getScreenCTM().a, t.getScreenCTM().b) * k;
          res.push({u, node: n.getAttribute('data-node'), px: Math.round(px * 10) / 10});
        }
      }
    }
    const s = x.getState({bounds: false}).semantic;
    x.destroy();
    el.remove();
    return {res, arrangement: s.arrangement, rowTextPx: s.rowTextPx};
  }, stress);
  expect(out.res.length).toBeGreaterThan(20);
  expect(out.res.filter(q => q.px < 16)).toEqual([]);
});
