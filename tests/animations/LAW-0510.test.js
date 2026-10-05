// LAW-0510 — Ley y foro pactados · mechanism (split tree: contract → two separate clause cards → own plaques; plain
// links; a tracer runs each route in turn; the loupe focuses the clause card being traced).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actors), actionProgress and finalState (the hold always shows both
// routes). objectLabels = destinations; traversal order = order.
// acceptanceCheck (brief): every connector ends on its element (edge-anchored, both ends on the right boxes), the order
// does not change when seeking (determinism battery + seekHistory) and relations are plain (no arrowheads, not causal).
// Windows (LAW-0510.js): links 0.12–0.28 · route 1 0.30–0.52 · route 2 0.52–0.72 · seam 0.72–0.77 · note 0.74–0.79 ·
// key 0.76–0.81.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct08-rendered.js';

const ID = 'LAW-0510';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const near = "((pt, b) => pt.x >= b.x - 16 && pt.x <= b.x + b.w + 16 && pt.y >= b.y - 16 && pt.y <= b.y + b.h + 16)";
const anchored = `s.links.every(l => ${near}(l.from, l.id.startsWith('in-') ? s.boxes.root : s.boxes[l.kind]) && ${near}(l.to, l.id.startsWith('in-') ? s.boxes[l.kind] : (l.kind === 'law' ? s.boxes.plaqueLaw : s.boxes.plaqueForum)))`;

contractSuite(ID, {
  continuity: ['tracerLaw', 'tracerForum', 'loupe'],
  semantic: [
    {at: 0, fn: "s.links.every(l => l.drawn === 0) && s.tracerShown === 0 && s.loupeParked && s.layoutOk", label: 'rest: components only'},
    {at: 0.29, fn: "s.links.filter(l => l.id.startsWith('in-')).every(l => l.drawn === 1) && s.links.filter(l => l.id.startsWith('to-')).every(l => l.drawn === 0)", label: 'contract links first'},
    {at: 0.45, fn: "s.active === 'law' && s.links.find(l => l.id === 'to-law').drawn > 0 && s.links.find(l => l.id === 'to-forum').drawn === 0", label: 'route 1 (law) before route 2'},
    {at: 1, fn: `s.links.every(l => l.drawn === 1) && s.links.length === 4 && s.arrows === 0 && s.linkKinds.every(k => k === 'relation') && ${anchored} && s.seamShown === 1 && s.keyShown === 1 && s.loupeParked`, label: 'hold: four plain anchored links, no link between clauses or plaques'},
    {at: 0.45, params: P('contrast-or-alternative'), fn: "s.order === 'forum>law' && s.active === 'forum'", label: 'alternative order: forum route first'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.links.every(l => l.drawn === 1)", label: 'labels hidden: the same routes'},
  ],
});

ratioChecks(ID, 'layout fits; links anchored; parked loupe clear', [
  {at: [0, 0.5, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [1], fn: anchored, label: 'every link ends on its own elements'},
  {at: [1], fn: '[...Object.values(s.boxes), ...s.labels].every(b => s.loupeBox.x > b.x + b.w || s.loupeBox.x + s.loupeBox.w < b.x || s.loupeBox.y > b.y + b.h || s.loupeBox.y + s.loupeBox.h < b.y)', label: 'the parked loupe covers no card, plaque or label'},
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
