// LAW-0512 — Ley y foro pactados · inspect (a lens isolates the plaque one clause points to; its supplied label is
// substituted; the other clause and plaque stay untouched).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actors), actionProgress and finalState (the hold is the after-value
// with the changed marker), order. objectLabels = destinations; the substituted datum is changed / afterValue.
// acceptanceCheck (brief): the detail keeps its source coordinates (lens framework: real copy at the same coordinates,
// zoom ≥ 1.5, smaller side ≥ 35 % of the short side), the change is localised (the other plaque label and needle never
// change) and seeking back restores the before-value exactly.
// Windows (LAW-0512.js): open 0.18–0.32 · out 0.40–0.43 · in 0.43–0.46 · was 0.46–0.50 · close 0.66–0.78 · context value
// 0.775–0.80 · marker 0.79–0.82 · notes 0.81–0.85 · key 0.82–0.86.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct08-rendered.js';

const ID = 'LAW-0512';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  semantic: [
    {at: 0, fn: "s.value === 'before' && s.lensOpen === 0 && s.contextDatum === 1 && s.markerShown === 0 && s.bandShown === 0", label: 'context: before-value'},
    {at: 0.38, fn: "s.lensOpen === 1 && s.copyShown === 1 && s.contextDatum === 0 && s.value === 'before' && s.zoom >= 1.5", label: 'lens open: datum in the lens only, real enlargement'},
    {at: 0.6, fn: "s.value === 'after' && s.lensOpen === 1 && s.bandShown === 1", label: 'substituted in the lens'},
    {at: 1, fn: "s.value === 'after' && s.lensOpen === 0 && s.markerShown === 1 && s.contextDatum === 1 && s.keyShown === 1 && s.layoutOk && s.changed === 'forum' && s.otherValue === 'Law X (fictional)'", label: 'back to context with the marker; the law plaque unchanged'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.changed === 'law' && s.shownValue === 'Law P (fictional)' && s.otherValue === 'Forum R (fictional)'", label: 'alternative: the law plaque is the one substituted'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.bandShown === 1", label: 'labels hidden: the emblem ring marks the change'},
  ],
});

test(`${ID}: seeking back restores the before-value; the datum is never legible in two places; the other clause never changes`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const params of ps) {
      const s0 = JSON.stringify(def.evaluate({params, timeMs: 0}).nodes);
      def.evaluate({params, timeMs: 6500});
      if (JSON.stringify(def.evaluate({params, timeMs: 0}).nodes) !== s0) bad.push('restore');
      const first = def.evaluate({params, timeMs: 0}).semantic;
      for (let i = 0; i <= 390; i++) {
        const s = def.evaluate({params, timeMs: i * 1000 / 60}).semantic;
        if (s.copyShown >= 0.15 && s.contextDatum >= 0.15) bad.push(`both at f${i}`);
        if (s.otherValue !== first.otherValue || s.otherNeedleDeg !== first.otherNeedleDeg) bad.push(`other changed at f${i}`);
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
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauses.law, p.clauses.forum, p.destinations[p.changed === 'law' ? 'forum' : 'law'], p.afterValue, ...p.annotations.map(a => a.text)]",
  content: "return [p.clauses.law, p.clauses.forum, p.afterValue]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.55});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies conflict-of-laws or forum doctrine (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
