// LAW-0108 — Razonamiento circular · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens is a real enlarged copy mapped onto its
// source rectangle), the change is localised (one datum; only the geometry that depends on it moves) and
// seeking back to earlier times restores exactly the previous datum.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {midWordSuite, everyLayoutSuite} from './razonamiento-circular-checks.js';

const ID = 'LAW-0108';

contractSuite(ID, {
  continuity: ['tagHole', 'stringEnd', 'premiseTL'],
  attach: [{from: 0, to: 1, a: 'stringEnd', b: 'premiseTL', tol: 0.5}],
  semantic: [
    {at: 0.18, fn: "s.value === 'before' && s.premiseRestsOn === 'claim' && s.apex < 0.5 && s.returnArrow === 1 && s.lens === 0 && s.box === 0", label: 'context: the produced state — premise and claim lean on each other, the arrow returns to the premise, the before value'},
    {at: 0.36, fn: "s.lens === 1 && s.value === 'before' && s.lensZoom >= 1.4", label: 'isolate: the lens is open on the tag (real enlarged copy), nothing changed yet'},
    {at: 0.36, fn: "(() => { const m = /translate\\(([-\\d.]+) ([-\\d.]+)\\) scale\\(([-\\d.]+)/.exec(s.lensContentTransform); return m && Math.abs(+m[3] - s.lensZoom) < 0.01; })()", label: 'the lens content is the context scaled about its source rectangle (same coordinates)'},
    {at: 0.5, fn: "!s.overlapBoth && s.strike === 1 && s.premiseAngle === 7", label: 'replace: the old value is struck and lifted before the new one appears; geometry still unchanged'},
    {at: 0.62, fn: "s.value === 'after' && s.ghostBefore === 1 && s.premiseAngle === 7", label: 'the new datum is shown; the old one stays traceable (struck note)'},
    {at: 0.8, fn: "s.premiseRestsOn === 'outside support' && s.box === 1 && s.returnArrow === 0 && s.arrowBoxToPremise === 1 && s.premiseAngle === -7", label: 'only the dependent geometry changed: returning arrow gone, box in, premise re-leans onto it'},
    {at: 1, fn: "s.lens === 0 && s.marker === 1 && s.value === 'after' && s.stringOnPremise", label: 'back to context with a changed-datum marker; the tag stays tied to the premise'},
    {at: 0.3, fn: "s.value === 'before' && s.valueText !== null && s.newOpacity === 0", label: 'seeking back before the change restores exactly the before value'},
    {at: 1, params: {focusTarget: 'premise-top'}, fn: "s.focusTarget === 'premise-top' && s.value === 'after'", label: 'the other focus target works'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.premiseRestsOn === 'outside support' && s.box === 1 && s.returnArrow === 0", label: 'labels hidden: the same substitution reads (box, re-lean, arrows)'},
    {at: 0.3, params: {textVisibility: 'none'}, fn: "s.box === 0 && s.premiseAngle === 7", label: 'labels hidden: nothing changes before the replace beat'},
    {at: 0.4, params: {focusTarget: 'premise-top'}, fn: 's.lensHasDatum && s.lens === 1', label: 'premise-top focus: the lens still contains the changed datum (the tag)'},
    {at: 0.1, fn: 's.caption === 1 && s.captionBefore === 0', label: 'context caption describes the before state while it is current'},
    {at: 1, fn: 's.caption === 0 && s.captionBefore === 1', label: 'after the change the context caption is relabelled "Before — …"'},
  ],
});

// Seek order independence of the datum: forward then back gives the same record as a fresh seek.
test(`${ID}: seeking back restores the previous datum exactly (all presets × ratios)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs * 0.4);
      const a = JSON.stringify(x.getState({bounds: false}).nodes);
      x.seek(x.durationMs);
      x.seek(x.durationMs * 0.4);
      const b = JSON.stringify(x.getState({bounds: false}).nodes);
      if (a !== b) fails.push({preset: pr.name, ratio});
      x.destroy(); el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});


// Rendered text audit (shared harness): every supplied field drawn un-truncated at the hold; supplied text
// >= 16 px (>= 19.5 px baseline) and never smaller than the generic captions; the no-conclusion key.
const FIELDS = 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, ...p.issues, ...p.assumptions, p.speaker.name, p.speaker.role, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]';
suppliedTextSuite(ID, {fields: FIELDS, content: 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, p.afterValue, p.speaker.name]', captions: 'return [p.contextLabels.context, ...p.issues, ...p.assumptions]'});
midWordSuite(ID, FIELDS, {strictHyphen: true});

// Review fixes (0108): the lens always contains the datum that changes; the window is a true copy of its source
// (same rotation, real text); it never turns translucent over the live scene while closing (no ghosts,
// items 4 and 19); the caption never shows both wordings; tall boxes use the floor (item 11).
everyLayoutSuite(ID, 'the lens contains the changed datum (the tag) for every focus target', 's.lensHasDatum && s.lens === 1', {at: [0.36, 0.5, 0.7]});
everyLayoutSuite(ID, 'the lens window opens and closes in place on a panel clear of the live scene (no ghost copies over the cards)',
  's.lensAtDest && s.destClear', {at: [0.2, 0.25, 0.3, 0.765, 0.78, 0.795, 0.81, 0.818], visibility: ['all', 'none']});
everyLayoutSuite(ID, 'the context caption never shows both wordings at once', '!(s.caption > 0 && s.captionBefore > 0)', {at: [0.52, 0.55, 0.56, 0.565, 0.58, 0.6]});
everyLayoutSuite(ID, 'tall boxes: the hold uses the floor (notes reach the lower part of the stage)', 's.layoutWide || s.contentBottom >= 0.8');

test(`${ID}: the lens shows a true copy — same card rotation and the real card texts (all presets × ratios)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    const squash = t => (t || '').replace(/\s+/g, '');
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      for (const u of [0.4, 0.7]) {
        x.seek(x.durationMs * u);
        const q = n => x.element.querySelector(`[data-node="${n}"]`);
        const p = x.getState({bounds: false}).params;
        const copyText = squash(q('lens-content').textContent);
        if (q('z-P').getAttribute('transform') !== q('P').getAttribute('transform')) bad.push(`${pr.name} ${ratio} u=${u}: premise pose differs`);
        if (q('z-C').getAttribute('transform') !== q('C').getAttribute('transform')) bad.push(`${pr.name} ${ratio} u=${u}: claim pose differs`);
        if (!copyText.includes(squash(p.facts[0]))) bad.push(`${pr.name} ${ratio} u=${u}: premise text missing in the copy`);
        if (!copyText.includes(squash(p.claim))) bad.push(`${pr.name} ${ratio} u=${u}: claim text missing in the copy`);
      }
      x.destroy(); el.remove();
    }
    return bad;
  }, [ID, presets]);
  expect(out).toEqual([]);
});
