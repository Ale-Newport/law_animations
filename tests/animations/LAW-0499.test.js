// LAW-0499 — Cláusula de terminación · contrast (rebuilt: two filing walls with an overhead carrier rail). Contract
// battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities and sharedFacts. Stress cap: the three stress sections are capped at 51–52
// characters under the standing coordinator rule of 2026-09-26 (AUTHORING item 20), measurements in the presets note.
// acceptanceCheck (brief): continuity (60 fps: both carriers and slips), anchored objects (each slip hangs from its
// carrier's cord until it lands), a transformation recognisable with the labels hidden (hook vs cover at the same
// slot; the slip hangs on the hook in A, settles in the tray in B). A and B are identical before the change beat (also
// labels hidden), run with equal timing, and end neutral: no winner, no outcome.
// Windows (LAW-0499.js): change 0.20–0.34 · run 0.40–0.56 · lower 0.58–0.72 · reel 0.72–0.77 · guide/tags/notes 0.77–0.86.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct05-rendered.js';

const ID = 'LAW-0499';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['slipA', 'slipB', 'carrierA', 'carrierB'],
  semantic: [
    {at: 0, fn: "s.lookA === s.lookB && s.hookA === 0 && s.coverB === 0 && s.guideShown === 0", label: 'base: the two walls are the same scene'},
    {at: 0.15, fn: "s.lookA === s.lookB", label: 'identical before the change beat'},
    {at: 0.36, fn: "s.hookA === 1 && s.coverB === 1 && s.slipAAt === 'rail' && s.slipBAt === 'rail'", label: 'the one changed fact appears at the same slot before the slips move'},
    {at: 0.5, fn: "s.slipAAt === 'running' && s.slipBAt === 'running' && s.carrierA.x - s.carrierB.x !== null", label: 'both carriers run together'},
    {at: 0.65, fn: "s.slipAAt === 'lowering' && s.slipBAt === 'lowering'", label: 'both slips are lowered for the same time'},
    {at: 1, fn: "s.slipAAt === 'hook' && s.slipBAt === 'tray' && s.linkedA === 2 && s.linkedB === null && s.guideShown === 1 && s.keyShown === 1 && s.layoutOk", label: 'hold: A hangs on section 2\'s hook, B rests in the tray; guide and neutral note'},
    {at: 1, fn: "s.guideBBottom <= s.slipBTopAtTray - 4 && s.slipB.y === s.slipBTopAtTray", label: 'B: the guide ends above the slip resting in the tray'},
    {at: 0.27, fn: "s.hookA > 0 && s.hookA < 1 && s.hookA === s.coverB", label: 'the hook (A) and the cover (B) move with equal timing'},
    {at: 0.5, fn: "Math.abs((s.slipA.x - s.carrierA.x) - (s.slipB.x - s.carrierB.x)) < 0.01", label: 'both slips ride their carriers identically'},
    {at: 0.75, fn: "s.slipAAt === 'hook' && s.slipBAt === 'tray' && s.tagsShown === 0", label: 'both land before the hold tags appear'},
    {at: 1, params: P('long-labels-stress'), fn: "s.linkedA === 3 && s.layoutOk", label: 'stress: section 3'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.slipAAt === 'hook' && s.slipBAt === 'tray'", label: 'labels hidden: the same contrast'},
  ],
});

identicalBeforeChange(ID, 0.2);

ratioChecks(ID, 'layout fits; walls stacked on tall boxes', [
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [1], fn: "s.arrangement === 'column'", ratios: ['9:16'], label: 'stacked in 9:16'},
  {at: [1], fn: "s.arrangement === 'row'", ratios: ['16:9'], label: 'side by side in 16:9'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title + ' · ' + p.clauseTitle, p.communication.label, p.scenarioA.label, p.scenarioB.label, ...p.clauses, p.changedFact, p.comparisonLabels.neutral, p.objectLabels.tray]",
  content: "return [p.communication.label, ...p.clauses]",
  captions: "return ['Section linked as supplied', 'No section linked · as supplied']",
  keyNote: true,
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies termination-rule wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
