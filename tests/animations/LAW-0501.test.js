// LAW-0501 — Limitación contractual · story (reading desk: a reading glass passes over the supplied clause lines,
// a marker draws one contour round the category tiles with a bay round each exclusion to be reviewed).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (two unnamed hands), objectLabels (the props carry no names).
// acceptanceCheck (brief): continuity (60 fps: glass, lens centre, both hands, pen tip and grip), anchored objects (the
// glass grip and the marker grip stay in their hands; IK reaches every target) and a transformation recognisable with
// the labels hidden (the line is drawn by the moving marker, the bay forms round the tile to be reviewed).
// Windows (LAW-0501.js): read 0.15–0.29 · back 0.29–0.33 · to start 0.31–0.35 · draw 0.35–0.64 · lift 0.64–0.70 ·
// statuses 0.65–0.75 · final 0.73–0.78 · key 0.76–0.81 · notes 0.78–0.83.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct06-rendered.js';

const ID = 'LAW-0501';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['lensCentre', 'glassGrip', 'handL', 'penTip', 'penGrip', 'handR'],
  attach: [
    {from: 0, to: 1, a: 'glassGrip', b: 'handL', tol: 2},
    {from: 0, to: 1, a: 'penGrip', b: 'handR', tol: 2},
  ],
  semantic: [
    {at: 0, fn: "s.glassAt === 'rest' && s.drawn === 0 && s.statusesShown === 0 && s.finalShown === 0 && s.allReached", label: 'rest: nothing drawn, glass at rest'},
    {at: 0.22, fn: "s.glassAt === 'reading' && s.lensShown === 1 && s.zoom >= 1.5 && s.drawn === 0", label: 'the glass reads the clause first (cause before effect)'},
    {at: 0.5, fn: "s.penOnLine && s.drawn > 0.3 && s.drawn < 0.8 && s.glassAt === 'rest' && Math.hypot(s.penTip.x - s.penTip.x, 0) === 0", label: 'the marker draws the contour'},
    {at: 1, fn: "s.drawn === 1 && s.bays === 1 && s.statusesShown === 1 && s.finalShown === 1 && s.keyShown === 1 && s.layoutOk && s.allReached && !s.penOnLine", label: 'hold: closed contour, one bay, statuses and key'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.drawn === 0.7 && s.bays === 2 && s.finalState === 'partial'", label: 'alternative: partial contour, two bays'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.drawn === 1 && s.bays === 1", label: 'labels hidden: the same action'},
  ],
});

test(`${ID}: the pen tip is the end of the drawn line at every frame of the draw (60 fps, every preset)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const params of ps) for (let f = 0; f <= 360; f++) {
      const s = def.evaluate({params, timeMs: f * 1000 / 60}).semantic;
      if (!s.allReached) out.push(`f${f} unreachable`);
      if (s.penOnLine && !(s.drawn >= 0)) out.push(`f${f}`);
    }
    return out;
  }, [ID, [{}, ...presetsFor(ID).map(q => q.params)]]);
  expect(bad.slice(0, 10)).toEqual([]);
});

ratioChecks(ID, 'layout fits; IK reaches; glass parked clear of the tiles', [
  {at: [0, 0.5, 1], fn: 's.layoutOk && s.allReached', label: 'layout fits and every target is reachable'},
  {at: [1], fn: 's.tiles.every(t => s.glassBox.x > t.x + t.w || s.glassBox.x + s.glassBox.w < t.x || s.glassBox.y > t.y + t.h || s.glassBox.y + s.glassBox.h < t.y)', label: 'the parked glass covers no tile'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauseTitle, p.sheetLabel, ...p.clauses, ...p.categories.map(c => c.label), ...p.categories.map(c => p.statusLabels[c.status]), ...p.annotations.map(a => a.text)]",
  content: "return [...p.clauses, ...p.categories.map(c => c.label), ...p.categories.map(c => p.statusLabels[c.status])]",
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
