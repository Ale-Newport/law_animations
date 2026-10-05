// LAW-0519 — Cláusula de cambio · contrast (two identical desks; only the route of the proposal card differs: A through
// the supplied steps and clipped to the contract, B set down beside the contract).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses as a list (the one change clause is `clause`), schedules, definitions, priorities, actorLabels (no actors),
// actionProgress and finalState (each route always completes). objectLabels = proposal; comparison = scenarioLabels +
// routeA / routeB. Stress preset field caps: coordinator standing rule 2026-09-26 (docs/AUTHORING.md item 20), see the
// presets note (contract title 50, card label 37 characters, both longer than the baseline).
// acceptanceCheck (brief): continuity (60 fps: both cards), anchored objects (A's card ends on the contract's attach spot
// with the clip after one tab per station; B's card ends on the beside spot, untouched by the presses) and a difference
// recognisable with the labels hidden (position, tabs, clip). Identical before the change beat (0.17).
// Windows (LAW-0519.js): lift 0.17–0.22 · beside 0.22–0.40 · track 0.22–0.60 · up 0.60–0.67 · clip 0.66–0.70 · guide
// 0.70–0.745 · note 0.73–0.78 · key 0.75–0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct10-rendered.js';

const ID = 'LAW-0519';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardA', 'cardB'],
  semantic: [
    {at: 0, fn: "s.lookA === s.lookB && s.tabsA === 0 && s.tabsB === 0 && s.layoutOk", label: 'base: both desks identical'},
    {at: 0.5, fn: "s.tabsA >= 1 && s.tabsB === 0 && s.besideB", label: 'A collects tabs on the track; B already rests beside the contract'},
    {at: 1, fn: "s.tabsA === s.steps && s.onContractA && !s.besideA && s.tabsB === 0 && s.besideB && !s.onContractB && s.guideShown === 1 && s.keyShown === 1", label: 'hold: A on the contract with one tab per step; B beside it, no tabs'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.besideA && s.tabsA === 0 && s.onContractB && s.tabsB === 2", label: 'alternative: the routes the other way round'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.onContractA && s.besideB", label: 'labels hidden: the same difference'},
  ],
});

identicalBeforeChange(ID, 0.17);

ratioChecks(ID, 'layout fits; equal boards', [
  {at: [0, 0.5, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0], fn: 's.sceneA.w === s.sceneB.w && s.sceneA.h === s.sceneB.h', label: 'the two desks have the same size'},
]);

test(`${ID}: every step count 2..4 lays out at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const bad = [];
    const steps = ['Step one as supplied', 'Step two as supplied', 'Step three as supplied', 'Step four as supplied'];
    for (let n = 2; n <= 4; n++) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({params: {steps: steps.slice(0, n)}, timeMs: 7500, width: w, height: h}).semantic;
      if (!s.layoutOk || s.tabsA !== n || !s.onContractA || !s.besideB) bad.push(`${n} ${w}x${h} ${s.why}`);
    }
    return bad;
  }, ID);
  expect(out).toEqual([]);
});

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clause, ...p.steps, p.proposal, p.scenarioLabels.a, p.scenarioLabels.b, ...p.annotations.map(a => a.text)]",
  content: "return [p.clause, ...p.steps, p.proposal]",
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
