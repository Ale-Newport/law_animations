// LAW-0119 — Límite de una conclusión · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (only the changed situation's
// supplied scope differs, and with it the cord's route) and no legal consequence is invented (states
// are only the supplied scopes; nothing says excluded, valid or decided).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {test, expect} from '@playwright/test';
import {suppliedTextSuite, identicalBeforeChange, RATIOS} from '../harness/supplied-text.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0119').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
// each loop encloses exactly the tokens supplied as covered in its own scene, clear of every token
const geometry = variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({
  at: 1, params: {...params, ...sa},
  fn: 's.scenes === 2 && s.clearA && s.clearB && JSON.stringify(s.insideA) === JSON.stringify(s.scopesA.map(x => x === "included")) && JSON.stringify(s.insideB) === JSON.stringify(s.scopesB.map(x => x === "included")) && s.differingSituations.length === 1',
  label: `both loops enclose exactly their supplied covered tokens; exactly one situation differs (${name}, ${shape})`,
})));

// review fixes (round 2)
const each = (times, fn, label, only) => variants.filter(([name]) => !only || only.includes(name)).flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}) @${at}`,
}))));
const fixes = [
  // review round 3: the changed-detail guide passes no card but the changed one (stacked maps included), and a tile's
  // pennant never covers its number disc
  ...each([1], 's.guideClear && s.pennantsClearOfDiscs', 'guide touches only the changed cards; pennants clear of the number discs'),
  // the maps stay the subject (AUTHORING items 3, 11, 18): side by side each is >= 40 % of the width and >= 30 % of the
  // height; stacked each is full width and >= 25 % of the height — never a thin strip under a text panel
  ...each([1], "s.arrangement === 'row' ? s.panelW >= 0.4 && s.mapFrac >= 0.3 : s.panelW >= 0.9 && s.mapFrac >= 0.25", 'the maps are substantial scenes'),
  // the change marker is a frame around the changed card in each scene's supplied scope (no stake, no look-alike pennant)
  ...each([0.35, 1], 's.lookA.markKind === s.scopeA && s.lookB.markKind === s.scopeB && s.lookA.mark === 1 && s.lookB.mark === 1', 'change frames follow the supplied scopes'),
  // the stress preset draws all six situations (full stress content, AUTHORING item 20)
  ...each([1], 's.scopesA.length === 6 && s.scopesB.length === 6', 'six situations drawn', ['long-labels-stress']),
];

contractSuite('LAW-0119', {
  continuity: ['reelA', 'reelB'],
  semantic: [
    {at: 0, fn: 's.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.marks === 0 && s.labelsShown === 0 && s.laid === 0', label: 'base: two identical scenes; no change frame, no label, nothing laid'},
    {at: 0.12, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.hi > 0', label: 'base: the changed token is picked out identically on both maps'},
    {at: 0.3, fn: "s.marks > 0 && s.lookA.markKind === 'included' && s.lookB.markKind === 'not-examined' && s.laid === 0", label: 'change: a solid cord-coloured frame in A, a thick dashed frame in B around the same card; the cords have not moved'},
    {at: 0.4, fn: 's.labelsShown === 1 && s.marks === 1 && s.lookA.hi === 0 && s.lookB.hi === 0', label: 'change: scenario labels are shown together with the change frames (which replace the base highlight)'},
    {at: 0.35, fn: 'JSON.stringify(s.differingSituations) === JSON.stringify([s.changed]) && JSON.stringify(s.scopesA.filter((x, i) => i !== s.changed)) === JSON.stringify(s.scopesB.filter((x, i) => i !== s.changed))', label: 'exactly the indicated situation differs; every other supplied scope is identical'},
    {at: 0.55, fn: 's.laid > 0 && s.laid < 1 && s.lookA.flags.every(v => v === 0) && s.lookB.flags.every(v => v === 0)', label: 'parallel: both reels lay their cords at the same pace; no marker before the loops close'},
    {at: 0.6, fn: 'JSON.stringify(s.lookA.tokens) === JSON.stringify(s.lookB.tokens)', label: 'parallel: the tokens stay in the same places in A and B'},
    {at: 1, fn: 's.closed && s.loopLenA > s.loopLenB && s.lookA.flags.filter(v => v === 1).length === s.lookB.flags.filter(v => v === 1).length + 1', label: 'A’s loop is longer (it takes the changed token in) and A has exactly one more pennant'},
    {at: 1, fn: 's.guide === 1 && s.notesDyn === 1 && s.notesStatic === 1', label: 'guide: the changed detail is joined; only-change and neutral notes are shown'},
    {at: 1, params: {scopeA: 'not-examined', scopeB: 'not-examined'}, fn: 's.differingSituations.length === 0 && s.loopLenA === s.loopLenB && JSON.stringify(s.lookA.flags) === JSON.stringify(s.lookB.flags)', label: 'identical supplied scopes give identical scenes (nothing invented)'},
    {at: 1, params: {changedSituation: 3, scopeA: 'not-examined', scopeB: 'included'}, fn: 'JSON.stringify(s.differingSituations) === JSON.stringify([3]) && s.loopLenB > s.loopLenA && s.insideB[3] && !s.insideA[3]', label: 'another changed situation and reversed scopes: the wider loop is in B, around situation 4 only'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.closed && s.loopLenA > s.loopLenB && s.lookA.markKind === "included" && s.lookB.markKind === "not-examined"', label: 'labels hidden: the same frames and loops show the difference'},
    ...geometry,
    ...fixes,
  ],
});

identicalBeforeChange('LAW-0119', 0.17);

// baselineMin 16: in 1:1 the baseline keeps the supplied situation text ON the cards at the 16 px floor so the two
// maps stay large (review round 2 fix option "keep supplied card text on the cards as real text >= 16 px");
// the 16:9 and 9:16 baselines draw it at >= 21 px.
suppliedTextSuite('LAW-0119', {
  baselineMin: 16,
  fields: 'return [...p.facts.map(f => f.text), p.rules.title, p.rules.proposition, ...p.issues, ...p.assumptions, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  // primary supplied content (checked >= 16 px in every preset × ratio): the proposition, the six situation texts,
  // the changed fact and the A/B state labels. Issues and assumptions are checked by the secondary-tier test below.
  content: 'return [...p.facts.map(f => f.text), p.rules.proposition, p.changedFact, p.scenarioA.label, p.scenarioB.label];',
  captions: 'return [p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.guide];',
});

// Secondary tier (coordinator decision, round 2): the supplied issues and assumptions are >= 16 px at 1080p in every
// preset × ratio EXCEPT long-labels-stress at 1:1, where they may go down to >= 14.5 px so the two maps keep >= ~30 %
// of the height; there they are never smaller than the generic captions (scenario captions, guide, shared facts,
// neutral line), which are capped at the same size.
const SECONDARY_EXCEPTION = {preset: 'long-labels-stress', ratio: '1:1', min: 14.5};
test('LAW-0119: issues and assumptions >= 16 px (>= 14.5 px only in long-labels-stress 1:1) and >= the generic captions', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0119')];
  const rows = await page.evaluate(async ([presets, ratios]) => {
    const def = await window.__lib.load('LAW-0119');
    const norm = x => String(x).toLowerCase().replace(/\s+/g, '');
    const out = [];
    for (const pr of presets) {
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        x.seek(x.durationMs);
        const p = x.getState({bounds: false}).params;
        const rootM = x.element.getScreenCTM();
        const k = 1080 / Math.min(w, h);
        const texts = [...x.element.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).map(t => {
          const m = rootM.inverse().multiply(t.getScreenCTM());
          return {n: norm([...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ')), px: parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k};
        });
        const pxOf = list => list.filter(Boolean).flatMap(f => texts.filter(tx => tx.n.includes(norm(f))).map(tx => tx.px));
        const sec = pxOf([...p.issues, ...p.assumptions]);
        const cap = pxOf([p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.guide, ...p.sharedFacts, p.comparisonLabels.neutral]);
        out.push({preset: pr.name, ratio, found: sec.length, minSec: sec.length ? Math.min(...sec) : null, maxCap: cap.length ? Math.max(...cap) : 0});
        x.destroy();
        el.remove();
      }
    }
    return out;
  }, [presets, RATIOS]);
  console.log(JSON.stringify(rows.map(r => [r.preset, r.ratio, r.minSec && +r.minSec.toFixed(1), +r.maxCap.toFixed(1)])));
  for (const r of rows) {
    const ex = r.preset === SECONDARY_EXCEPTION.preset && r.ratio === SECONDARY_EXCEPTION.ratio;
    expect.soft(r.found, `${r.preset} ${r.ratio}: issues/assumptions drawn`).toBeGreaterThan(0);
    expect.soft(r.minSec, `${r.preset} ${r.ratio}: issues/assumptions px`).toBeGreaterThanOrEqual(ex ? SECONDARY_EXCEPTION.min : 16);
    expect.soft(r.minSec, `${r.preset} ${r.ratio}: issues/assumptions never smaller than the generic captions`).toBeGreaterThanOrEqual(r.maxCap - 0.6);
  }
});
