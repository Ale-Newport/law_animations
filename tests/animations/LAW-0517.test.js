// LAW-0517 — Cláusula de cambio · story (a loupe reads the change clause; the procedure track lights; the amendment sheet
// travels it, taking one layer tab per supplied step, and is clipped to the contract).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses as a list (the one change clause is `clause`), schedules, definitions, priorities, actorLabels (no actors),
// actionProgress and finalState (the action always completes). objectLabels = proposal (the amendment sheet label).
// acceptanceCheck (brief): continuity (60 fps: sheet, loupe, press heads), anchored objects (the sheet stops on each pad
// and the press touches its edge; it ends on the contract's attach spot with the clip) and a transformation recognisable
// with the labels hidden (tabs accumulate, the sheet changes place).
// Windows (LAW-0517.js): loupe→clause 0.02–0.16 · clause lit 0.15–0.19 · rail 0.17–0.27 · loupe back 0.20–0.33 · travel
// 0.28–0.645 (per station: move, press down, press up) · attach 0.645–0.715 · clip 0.71–0.75 · note 0.745–0.79 · key 0.76–0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct10-rendered.js';

const ID = 'LAW-0517';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const inside = "((a, b) => a.x >= b.x - 2 && a.y >= b.y - 2 && a.x + a.w <= b.x + b.w + 2 && a.y + a.h <= b.y + b.h + 2)";
const apart = "((a, b) => a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y)";

contractSuite(ID, {
  continuity: ['sheet', 'loupe', 'press0', 'press1', 'pressLast'],
  semantic: [
    {at: 0, fn: "s.tabs === 0 && s.railLit === 0 && s.atStation === 0 && !s.attached && s.clipShown === 0 && s.loupeParked && s.layoutOk", label: 'rest: sheet in the tray, rail unlit, no tabs'},
    {at: 0.17, fn: "s.reading && s.clauseLit > 0 && s.atStation === 0 && s.tabs === 0", label: 'the loupe reads the clause before anything moves (cause before effect)'},
    {at: 0.275, fn: "s.railLit === 1 && s.atStation === 0", label: 'the procedure track is lit before the sheet leaves the tray'},
    {at: 0.45, fn: "s.tabs >= 1 && s.tabs < s.steps && !s.attached", label: 'mid-travel: some tabs, not all'},
    {at: 1, fn: `s.tabs === s.steps && s.attached && s.clipShown === 1 && ${inside}(s.sheetBox, s.contractBox) && s.keyShown === 1 && s.loupeParked`, label: 'hold: one tab per step; the sheet lies on the contract with the clip'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.steps === 2 && s.tabs === 2 && s.attached", label: 'alternative: two steps, two tabs'},
    {at: 1, params: P('long-labels-stress'), fn: "s.steps === 4 && s.tabs === 4 && s.attached", label: 'stress: four steps, four tabs'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.tabs === s.steps && s.attached", label: 'labels hidden: the same travel'},
  ],
});

ratioChecks(ID, 'layout fits; the parked loupe covers nothing; the sheet never covers the clause', [
  {at: [0, 0.5, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0, 1], fn: `s.obstacleBoxes.every(b => ${apart}(s.loupeBox, b))`, label: 'the parked loupe covers no plate, tray or contract'},
  {at: [0.3, 0.5, 0.66, 0.7, 1], fn: `${apart}(s.sheetBox, s.clauseBox)`, label: 'the sheet never covers the change clause'},
]);

test(`${ID}: every step count 2..4 lays out at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const bad = [];
    const steps = ['Step one as supplied', 'Step two as supplied', 'Step three as supplied', 'Step four as supplied'];
    for (let n = 2; n <= 4; n++) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({params: {steps: steps.slice(0, n)}, timeMs: 6000, width: w, height: h}).semantic;
      if (!s.layoutOk || s.tabs !== n || !s.attached) bad.push(`${n} ${w}x${h} ${s.why}`);
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
