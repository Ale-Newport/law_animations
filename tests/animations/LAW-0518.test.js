// LAW-0518 — Cláusula de cambio · mechanism (exploded layers: the clause tab's post holds one gate per supplied step;
// the amendment layer descends through the gates, gaining one edge band each, and settles on the contract slab).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses as a list (the one change clause is `clause`), schedules, definitions, priorities, actorLabels (no actors),
// actionProgress and finalState (the descent always completes). objectLabels = proposal (the layer label).
// acceptanceCheck (brief): continuity (60 fps: layer, tracer), anchored objects (the layer passes each gate at its level
// and ends on the slab's landing footprint) and a transformation recognisable with the labels hidden (bands accumulate,
// the layer changes level, rings light).
// Windows (LAW-0518.js): post 0.12–0.30 · descent 0.30–0.66 (per gate: move, pass) · land 0.66–0.735 · slab rim
// 0.72–0.76 · note 0.755–0.80 · key 0.77–0.81.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct10-rendered.js';

const ID = 'LAW-0518';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['layer', 'tracer'],
  semantic: [
    {at: 0, fn: "s.bands === 0 && s.spine === 0 && s.layer.y === s.y0 && !s.landed && s.layoutOk", label: 'rest: layer at the top, post unlit, no bands'},
    {at: 0.3, fn: "s.spine === 1 && s.bands === 0 && s.layer.y === s.y0", label: 'the clause post is lit before the layer moves (cause before effect)'},
    {at: 0.45, fn: "s.bands >= 1 && s.bands < s.steps && s.focus >= 0", label: 'mid-descent: some bands; the current step is in focus'},
    {at: 1, fn: "s.bands === s.steps && s.landed && s.layer.y === s.yLand && s.slabRim === 1 && s.keyShown === 1", label: 'hold: one band per step; the layer rests on the slab'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.steps === 2 && s.bands === 2 && s.landed", label: 'alternative: two gates, two bands'},
    {at: 1, params: P('long-labels-stress'), fn: "s.steps === 4 && s.bands === 4 && s.landed", label: 'stress: four gates, four bands'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.bands === s.steps && s.landed", label: 'labels hidden: the same descent'},
  ],
});

ratioChecks(ID, 'layout fits; the layer passes each gate level in order', [
  {at: [0, 0.5, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0], fn: 's.levels.every((v, i) => v > (i ? s.levels[i - 1] : s.y0)) && s.yLand > s.levels[s.levels.length - 1]', label: 'gates stacked between the start and the slab'},
]);

test(`${ID}: every step count 2..4 lays out at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const bad = [];
    const steps = ['Step one as supplied', 'Step two as supplied', 'Step three as supplied', 'Step four as supplied'];
    for (let n = 2; n <= 4; n++) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({params: {steps: steps.slice(0, n)}, timeMs: 7000, width: w, height: h}).semantic;
      if (!s.layoutOk || s.bands !== n || !s.landed) bad.push(`${n} ${w}x${h} ${s.why}`);
    }
    return bad;
  }, ID);
  expect(out).toEqual([]);
});

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clause, ...p.steps, p.proposal, ...p.annotations.map(a => a.text)]",
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
