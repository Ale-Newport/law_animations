// LAW-0509 — Ley y foro pactados · story (two separate clause tabs slide out of the contract; each compass needle swings
// to its own plaque and a sight line is drawn).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actors), actionProgress and finalState (the action always
// completes). objectLabels = destinations (plaque labels).
// acceptanceCheck (brief): continuity (60 fps: loupe, both dial centres, both needle tips), anchored objects (each line
// ends at its own plaque; the dial rides on its own tab) and a transformation recognisable with the labels hidden.
// Windows (LAW-0509.js): loupe→1 0.10–0.22 · tab1 0.22–0.29 · needle1 0.28–0.37 · line1 0.36–0.43 · loupe→2 0.29–0.39 ·
// tab2 0.40–0.47 · needle2 0.46–0.55 · line2 0.54–0.62 · loupe back 0.58–0.70 · note 0.72–0.77 · key 0.74–0.79.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct08-rendered.js';

const ID = 'LAW-0509';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const inBox = "((pt, b) => pt.x >= b.x - 12 && pt.x <= b.x + b.w + 12 && pt.y >= b.y - 12 && pt.y <= b.y + b.h + 12)";

contractSuite(ID, {
  continuity: ['loupe', 'dialA', 'dialB', 'needleA', 'needleB'],
  semantic: [
    {at: 0, fn: "s.tabs.every(t => t === 0) && s.lines.every(l => l === 0) && s.needleDeg[0] === s.restDeg[0] && s.needleDeg[1] === s.restDeg[1] && s.loupeParked && s.layoutOk", label: 'rest: tabs in, needles at rest, no lines'},
    {at: 0.25, fn: "s.reading === s.kinds[0] && s.lines[0] === 0 && s.tabs[1] === 0", label: 'the loupe reads the first clause before anything points (cause before effect)'},
    {at: 0.45, fn: "s.lines[0] === 1 && s.needleDeg[0] === s.targetDeg[0] && s.needleDeg[1] === s.restDeg[1] && s.lines[1] === 0", label: 'first clause points; the second has not moved'},
    {at: 1, fn: `s.lines.every(l => l === 1) && s.needleDeg[0] === s.targetDeg[0] && s.needleDeg[1] === s.targetDeg[1] && !s.linesCross && ${inBox}(s.ends[0], s.plaqueBoxes[0]) && ${inBox}(s.ends[1], s.plaqueBoxes[1]) && s.plaqueBoxes[0].kind === s.kinds[0] && s.keyShown === 1 && s.loupeParked`, label: 'hold: each line ends on its own plaque; lines never cross'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.order === 'forum>law' && s.kinds[0] === 'forum' && s.plaqueBoxes[0].kind === 'forum'", label: 'alternative: forum clause first, still to its own plaque'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.lines.every(l => l === 1) && !s.linesCross", label: 'labels hidden: the same pointing'},
  ],
});

ratioChecks(ID, 'layout fits; parked loupe clear of plaques and sheet', [
  {at: [0, 0.5, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [1], fn: '[...s.plaqueBoxes, ...s.textBoxes].every(b => s.loupeBox.x > b.x + b.w || s.loupeBox.x + s.loupeBox.w < b.x || s.loupeBox.y > b.y + b.h || s.loupeBox.y + s.loupeBox.h < b.y)', label: 'the parked loupe covers no plaque or sheet'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum, ...p.annotations.map(a => a.text)]",
  content: "return [p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum]",
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
