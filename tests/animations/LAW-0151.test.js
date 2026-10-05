// LAW-0151 — Remisión entre artículos · contrast. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: both scenes exist, exactly the indicated fact
// changes (only the changed article's own cross-reference phrase is printed, in B), and
// no legal consequence is invented (the states are only the supplied paths; nothing is
// ranked, preferred or resolved).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
// shared per-ratio runner (real 16:9 / 1:1 / 9:16 instances × every preset × labels shown/hidden)
import {ratioChecks} from '../harness/ratio-checks.js';

const ALT = presetsFor('LAW-0151').find(q => q.name === 'contrast-or-alternative').params;

contractSuite('LAW-0151', {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && s.sameGeometry && JSON.stringify(s.a) === JSON.stringify({...s.b, trails: s.a.trails, cueRead: s.a.cueRead}) && s.a.changed === 0 && s.a.label === 0 && s.a.at === 0", label: 'base: two identical scenes; the changed row is an empty slot in both; no scenario label yet'},
    {at: 0.3, fn: "s.a.changed > 0 && s.a.changed === s.b.changed && s.a.at === 0 && s.b.at === 0 && s.a.trails[0] === 0", label: 'change beat: the slot is written in both scenes at once, before any flag moves'},
    {at: 0.5, fn: "JSON.stringify(s.a.flag) === JSON.stringify(s.b.flag) && s.a.trails[0] === s.b.trails[0] && s.a.trails[0] > 0", label: 'parallel: both flags make the same first hop at the same moment'},
    {at: 0.66, fn: "s.a.at === 1 && s.a.done === 1 && s.b.done >= 1 && s.b.at !== 2", label: 'A stops at Art. 9 while B is still following the chain'},
    {at: 1, fn: "s.a.at === 1 && s.a.ring === 1 && s.b.at === 2 && s.b.done === 2 && s.b.ring === 1 && s.b.trails.every(v => v === 1)", label: 'the changed fact changes the sequence: A ends at Art. 9, B hops on to Art. 12'},
    {at: 1, fn: "s.guide === 1 && s.neutralShown === 1 && JSON.stringify(s.pathA) === '[0,1]' && JSON.stringify(s.pathB) === '[0,1,2]'", label: 'guide joins the changed rows; neutral note; paths exactly as supplied'},
    {at: 1, params: ALT, fn: "s.a.at === 2 && s.b.at === 0 && s.b.done === 2 && s.changedArticle === 2", label: 'alternative: B turns back to Art. 2 on the first page; A stops at Art. 9'},
    {at: 1, params: {pathB: [0, 1]}, fn: "s.a.at === s.b.at && s.a.done === s.b.done && JSON.stringify(s.a.trails) === JSON.stringify(s.b.trails)", label: 'identical supplied paths give identical sequences (nothing invented from the printed phrase)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.a.at === 1 && s.b.done === 2 && s.a.changed === 1", label: 'labels hidden: the same difference in sequence is visible'},
  ],
});

identicalBeforeChange('LAW-0151', 0.17);

suppliedTextSuite('LAW-0151', {
  fields: 'return [p.sources[0].title, ...p.hierarchy.levels, ...p.passages.map(x => x.ref), ...p.passages.map(x => x.cue), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, ...p.interpretations.flatMap(i => [i.by, i.text])];',
  content: 'return [...p.hierarchy.levels, ...p.passages.map(x => x.ref), ...p.passages.map(x => x.cue), p.scenarioA.label, p.scenarioB.label, p.changedFact];',
  captions: 'return [p.scenarioA.caption, p.scenarioB.caption, "no conclusion drawn", "sin conclusión"];',
});

ratioChecks('LAW-0151', 'parked flags and trails clear of text; articles fit; scenes large', [
  {at: [1], fn: 's.flagClear && s.trailTextHits === 0 && !s.volumeOverflow', label: 'hold: flags and trails clear of text; articles fit their pages'},
  {at: [1], fn: "s.arrangement === 'row' ? s.stageW >= 0.4 : s.stageW >= 0.9", label: 'each scene is >= 40 % of the width side by side, full width when stacked'},
]);

// Review round 2: the changed-row box never runs through text, and B's extra hop (the whole difference)
// is a long trail with its badge beside it — every preset × real ratio × labels shown/hidden.
ratioChecks('LAW-0151', 'changed-row box clear of text; B\'s hops prominent', [
  {at: [0.8, 1], fn: 's.frameClear', label: 'the dashed changed-row box encloses the slot without crossing any text'},
  {at: [1], fn: 's.badgesClear && s.trailLengthsB.every(v => v >= 120)', label: 'B\'s trails are >= 120 units long, badges beside them, clear of flags and text'},
]);
