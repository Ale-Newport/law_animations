// LAW-0520 — Cláusula de cambio · inspect (the travelled track steps aside; a lens isolates one station's step plate; its
// supplied wording is substituted; back in context with the Δ marker).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses as a list (the one change clause is `clause`), schedules, definitions, priorities, actorLabels (no actors),
// actionProgress and finalState (the hold is the after-value with the marker). Substituted datum = changedStep/afterValue.
// acceptanceCheck (brief): real copy at the same coordinates (lens framework, zoom ≥ 1.5, smaller side ≥ 35 % of the short
// side), context step-aside at scale ≥ 0.45, the change is localised (other steps never change), the datum is never
// legible in two places, and seeking back restores the before-value exactly.
// Windows (LAW-0520.js): open 0.20–0.34 · out 0.42–0.45 · in 0.45–0.48 · was 0.48–0.52 · close 0.68–0.80 · context value
// 0.795–0.82 · marker 0.81–0.84 · notes 0.83–0.87 · key 0.84–0.88.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct10-rendered.js';

const ID = 'LAW-0520';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  semantic: [
    {at: 0, fn: "s.value === 'before' && s.lensOpen === 0 && s.contextDatum === 1 && s.markerShown === 0 && s.contextScale === 1", label: 'context: before-value at full size'},
    {at: 0.38, fn: "s.lensOpen === 1 && s.copyShown === 1 && s.contextDatum === 0 && s.value === 'before' && s.zoom >= 1.5 && s.contextScale >= 0.45", label: 'lens open; datum in the lens only; context stepped aside ≥ 0.45'},
    {at: 0.6, fn: "s.value === 'after' && s.lensOpen === 1 && s.bandShown === 1", label: 'substituted in the lens'},
    {at: 1, fn: "s.value === 'after' && s.lensOpen === 0 && s.markerShown === 1 && s.contextDatum === 1 && s.contextScale === 1 && s.keyShown === 1 && s.layoutOk && s.changedStep === 2", label: 'back to context with the marker'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.changedStep === 1 && s.others.length === 2", label: 'alternative: step 1 substituted'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.bandShown === 1", label: 'labels hidden: the pip ring marks the change'},
  ],
});

test(`${ID}: seeking back restores the before-value; the datum is never legible in two places; other steps never change`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const params of ps) {
      const s0 = JSON.stringify(def.evaluate({params, timeMs: 0}).nodes);
      def.evaluate({params, timeMs: 7000});
      if (JSON.stringify(def.evaluate({params, timeMs: 0}).nodes) !== s0) bad.push('restore');
      const first = def.evaluate({params, timeMs: 0}).semantic;
      for (let i = 0; i <= 480; i++) {
        const s = def.evaluate({params, timeMs: i * 1000 / 60}).semantic;
        if (s.copyShown >= 0.15 && s.lensOpen > 0 && s.contextDatum >= 0.15) bad.push(`both at f${i}`);
        if (JSON.stringify(s.others) !== JSON.stringify(first.others)) bad.push(`other changed at f${i}`);
      }
    }
    return bad;
  }, [ID, [{}, ...presetsFor(ID).map(q => q.params)]]);
  expect(out.slice(0, 10)).toEqual([]);
});

ratioChecks(ID, 'lens is a real inspection', [
  {at: [0.5], fn: 's.layoutOk && s.zoom >= 1.5 && s.contextScale >= 0.45', label: 'layout fits; zoom ≥ 1.5; context ≥ 0.45'},
  {dom: "(() => { const r = svg.querySelector('[data-node=\"lens-border\"]').getBoundingClientRect(); const R = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal; const k = Math.min(R.width / vb.width, R.height / vb.height); return Math.min(r.width, r.height) / (k * Math.min(vb.width, vb.height)) >= 0.35; })()", at: [0.5], label: 'lens smaller side ≥ 35 % of the frame short side'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clause, ...p.steps.filter((s, i) => i !== Math.min(p.changedStep, p.steps.length) - 1), p.afterValue, p.proposal, ...p.annotations.map(a => a.text)]",
  content: "return [p.clause, p.afterValue, p.proposal]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.55});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies doctrine or a conclusion on a change (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
