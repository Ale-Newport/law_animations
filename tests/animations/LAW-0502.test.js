// LAW-0502 — Limitación contractual · mechanism (three transparent layers — clause text, contour, categories — slide
// apart along a diagonal rail; plain lines tie each clause line to its categories; a bead traces one category).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, relationships/relationLabels (the only relation is each category's supplied
// clause line, drawn as a plain line), elements (the layer labels are the layerLabels field).
// acceptanceCheck (brief): continuity (60 fps: the three layers, the bead), anchored objects (the relations are drawn
// only after the layers have separated and end on their clause line and tile) and a transformation recognisable with
// the labels hidden (the stack separates, lines are drawn, the bead travels, the focus element enlarges).
// Windows (LAW-0502.js): explode 0.04–0.19 · text 0.18–0.22 · relations 0.22–0.42 · trace 0.45–0.72 · statuses
// 0.73–0.78 · key 0.77–0.82 · notes 0.79–0.84.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct06-rendered.js';

const ID = 'LAW-0502';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['layer0', 'layer1', 'layer2', 'bead'],
  semantic: [
    {at: 0, fn: "!s.separated && s.relationsDrawn === 0 && s.beadShown === 0 && s.statusesShown === 0", label: 'start: the layers are stacked, nothing drawn'},
    {at: 0.21, fn: "s.separated && s.relationsDrawn === 0", label: 'the layers separate before any relation is drawn'},
    {at: 0.43, fn: "s.relationsDrawn === s.relations && s.arrows === 0 && s.beadShown === 0", label: 'every supplied relation drawn, as plain lines (no arrows)'},
    {at: 0.6, fn: "s.beadShown === 1", label: 'the bead travels'},
    {at: 1, fn: "s.separated && s.relationsDrawn === s.relations && s.beadShown === 0 && s.statusesShown === 1 && s.keyShown === 1 && s.layoutOk && s.focusGrow === 0", label: 'hold: states visible, bead gone'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.separated && s.relationsDrawn === s.relations", label: 'labels hidden: the same mechanism'},
  ],
});

test(`${ID}: the bead follows traversalOrder and dwells longest on focusElement, which enlarges`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, cases]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const params of cases) {
      const visits = [], dwell = {};
      let grew = 0;
      for (let i = 0; i <= 400; i++) {
        const s = def.evaluate({params, timeMs: (i / 400) * 6500}).semantic;
        if (s.tracerAt) { dwell[s.tracerAt] = (dwell[s.tracerAt] || 0) + 1; if (visits[visits.length - 1] !== s.tracerAt) visits.push(s.tracerAt); }
        grew = Math.max(grew, s.focusGrow);
      }
      res.push({visits, dwell, grew, order: params.traversalOrder || ['clause', 'contour', 'category'], focus: params.focusElement || 'contour'});
    }
    return res;
  }, [ID, [{}, P('contrast-or-alternative')]]);
  for (const r of out) {
    expect(r.visits).toEqual(r.order);
    expect(Object.entries(r.dwell).sort((a, b) => b[1] - a[1])[0][0]).toBe(r.focus);
    expect(r.grew).toBeGreaterThan(0.1);
  }
});

ratioChecks(ID, 'layout fits', [
  {at: [0, 0.5, 1], fn: 's.layoutOk', label: 'layout fits'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title + ' · ' + p.clauseTitle, p.layerLabels.clause, p.layerLabels.contour, p.layerLabels.category, ...p.clauses, ...p.categories.map(c => c.label), p.statusLabels.included, p.statusLabels.review, ...p.annotations.map(a => a.text)]",
  content: "return [...p.clauses, ...p.categories.map(c => c.label), p.statusLabels.included, p.statusLabels.review]",
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
