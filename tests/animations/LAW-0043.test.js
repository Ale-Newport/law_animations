// LAW-0043 — Búsqueda por términos · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes, and
// no legal consequence is invented to complete the contrast.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

const stress = presetsFor('LAW-0043').find(x => x.name === 'long-labels-stress').params;
// safe areas that turn the 16:9 test frame into a square / portrait content box
const SQUARE = {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}};
const PORTRAIT = {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}};

contractSuite('LAW-0043', {
  continuity: ['tokA0', 'tokB0', 'tokA1', 'tokB1', 'tokBctx'],
  semantic: [
    {at: 0.1, fn: 's.a.typed === s.b.typed && s.a.linked.length === 0 && s.b.linked.length === 0 && s.bloomB === 0', label: 'identical base situation in A and B'},
    {at: 0.3, fn: 's.bloomB > 0 && s.a.linked.length === 0 && s.b.linked.length === 0', label: 'the change (related wording) is introduced in B only, before any link'},
    {at: 0.47, fn: 'JSON.stringify(s.tokA0) === JSON.stringify(s.tokB0) && JSON.stringify(s.tokA1) === JSON.stringify(s.tokB1)', label: 'exact-match tokens travel identically in parallel'},
    {at: 0.6, fn: 'JSON.stringify(s.a.linked) === JSON.stringify(s.b.linked)', label: 'shared exact links are identical in both scenes'},
    {at: 1, fn: 's.a.linked.every(k => s.b.linked.includes(k)) && s.b.linked.length > s.a.linked.length', label: 'B links everything A links plus the related-wording passages'},
    {at: 1, fn: "s.a.contextual === 0 && s.b.contextual > 0 && s.a.linked.every(k => k.endsWith(':exact'))", label: 'only the matching mode differs (A exact, B contextual)'},
    {at: 1, fn: 's.guideProgress === 1 && s.changedPassage !== null', label: 'the comparison guide rings the passage only B links'},
    {at: 1, fn: 's.a.cardLines === s.a.linked.length && s.b.cardLines === s.b.linked.length', label: 'each card lists its own linked passages (no score or ranking)'},
    {at: 1, fn: 's.cardSize.a !== null && s.cardSize.a === s.cardSize.b', label: 'both cards print their lines at the same size'},
    {at: 0.5, fn: 's.detailMarkB === 0 && s.detailMarkA === 0', label: 'the enlarged passage is unmarked in both details before B links it (no early state)'},
    {at: 1, fn: 's.detailMarkB === 1 && s.detailMarkA === 0', label: 'the enlarged passage is linked in B only'},
    {at: 1, fn: 's.detailFontPx >= 20', label: 'the changed detail is shown at 20 px or more (1080p)'},
    // each enlarged detail belongs visibly to its own scene: it sits directly
    // under that scene (never between A and B's header) — reviewer fix
    {at: 1, fn: "s.arrangement === 'row' && s.detailsUnderOwnScene", label: 'each detail panel sits under its own scene (landscape)'},
    {at: 1, params: SQUARE, fn: "s.arrangement === 'row' && s.detailsUnderOwnScene", label: 'each detail panel sits under its own scene (square content box)'},
    {at: 1, params: PORTRAIT, fn: "s.arrangement === 'column' && s.detailsUnderOwnScene", label: 'each detail panel sits under its own scene (portrait content box)'},
    {at: 1, params: {...stress, ...PORTRAIT}, fn: "s.arrangement === 'column' && s.detailsUnderOwnScene", label: 'each detail panel sits under its own scene with long labels (portrait content box)'},
    // A's slot states 'no related wording' only once B's list appears
    {at: 0.1, fn: 's.noRelatedA === 0 && s.bloomB === 0', label: "A's slot shows no 'no related wording' state before the change"},
    {at: 0.35, fn: 's.noRelatedA === 1 && s.bloomB === 1', label: "A's slot states 'no related wording' as B's list appears"},
  ],
});

// Real frame sizes (the semantic battery above runs at 1920×1080 only): for
// every preset × 16:9/9:16/1:1, each detail panel sits under its own scene
// and the changed detail stays at 20 px or more (about 20 px — at least 19 —
// in the long-labels stress preset, where the scenes keep their size and
// the text gives way slightly).
test('LAW-0043: detail panels under their own scene at about 20 px (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0043');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0043');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `own-${rows.length}`, params: pr.params});
        await x.ready;
        x.seek(x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        rows.push({preset: pr.name, ratio, arrangement: s.arrangement, own: s.detailsUnderOwnScene, px: s.detailFontPx});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  const bad = out.filter(q => !q.own || q.px < (q.preset === 'long-labels-stress' ? 19 : 20) || (q.ratio === '9:16') !== (q.arrangement === 'column'));
  expect(bad, JSON.stringify(out, null, 1)).toEqual([]);
});
