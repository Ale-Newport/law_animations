// LAW-0504 — Limitación contractual · inspect (a lens isolates one category tile on the delimited sheet; its supplied
// status is substituted and the contour beside it re-routes).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actors), objectLabels (the props carry no names), finalState (the
// hold is the after-value with the changed marker).
// Preset note: long-labels-stress keeps the baseline count of three categories (four long ones do not fit the 1:1 lens
// floor of ≥ 1.5× with a real crop); every text field is longer than in the baseline.
// acceptanceCheck (brief): continuity (the lens box and the contour are drawn per frame from the open/close progress),
// the lens is a real enlargement (≥ 1.5×, smaller side ≥ 35 % of the frame's short side), the datum is legible in one
// place at a time (context copy blanked while the lens shows it), the substitution is recognisable with the labels hidden
// (the contour re-routes) and seeking back restores the before-value exactly.
// Windows (LAW-0504.js): open 0.18–0.32 · out 0.36–0.44 · was 0.42–0.47 · in 0.46–0.53 · retract 0.55–0.60 · draw
// 0.60–0.67 · close 0.69–0.79 · context value 0.785–0.81 · marker 0.79–0.82 · notes 0.81–0.85 · key 0.82–0.86.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct06-rendered.js';

const ID = 'LAW-0504';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  semantic: [
    {at: 0, fn: "s.value === 'before' && s.lensOpen === 0 && s.contextDatum === 1 && s.markerShown === 0 && s.routeOld === 1 && s.routeNew === 0", label: 'context: before-value, old route'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.copyShown === 1 && s.contextDatum === 0 && s.value === 'before' && s.zoom >= 1.5", label: 'lens open: datum in the lens only, real enlargement'},
    {at: 0.62, fn: "s.value === 'after' && s.lensOpen === 1 && s.routeOld === 0 && s.routeNew > 0", label: 'substituted; the route follows'},
    {at: 1, fn: "s.value === 'after' && s.lensOpen === 0 && s.markerShown === 1 && s.contextDatum === 1 && s.routeNew === 1 && s.keyShown === 1 && s.layoutOk", label: 'back to context with the changed marker'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.routeNew > 0", label: 'labels hidden: the re-route reads'},
  ],
});

test(`${ID}: seeking back restores the before-value exactly; the datum is never legible in two places`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const params of ps) {
      const s0 = JSON.stringify(def.evaluate({params, timeMs: 0}).nodes);
      def.evaluate({params, timeMs: 6500});
      if (JSON.stringify(def.evaluate({params, timeMs: 0}).nodes) !== s0) bad.push('restore');
      for (let i = 0; i <= 390; i++) {
        const s = def.evaluate({params, timeMs: i * 1000 / 60}).semantic;
        if (s.copyShown >= 0.15 && s.contextDatum >= 0.15) bad.push(`both at f${i}`);
      }
    }
    return bad;
  }, [ID, [{}, ...presetsFor(ID).map(q => q.params)]]);
  expect(out.slice(0, 10)).toEqual([]);
});

ratioChecks(ID, 'lens is a real inspection', [
  {at: [0.5], fn: 's.layoutOk && s.zoom >= 1.5', label: 'layout fits; zoom ≥ 1.5'},
  {dom: "(() => { const r = svg.querySelector('[data-node=\"lens-border\"]').getBoundingClientRect(); const R = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal; const k = Math.min(R.width / vb.width, R.height / vb.height); return Math.min(r.width, r.height) / (k * Math.min(vb.width, vb.height)) >= 0.35; })()", at: [0.5], label: 'lens smaller side ≥ 35 % of the frame short side'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title + ' · ' + p.clauseTitle, p.sheetLabel, ...p.categories.map(c => c.label), p.statusLabels[p.afterValue], ...p.annotations.map(a => a.text)]",
  content: "return [...p.categories.map(c => c.label), p.statusLabels[p.afterValue]]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.55});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies limitation doctrine, caps or amounts (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
