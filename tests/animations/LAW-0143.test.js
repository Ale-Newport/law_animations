// LAW-0143 — Ámbito territorial · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (only the zone supplied for
// the shared fact differs, and with it the pawn's path, tile and ring) and no legal consequence is
// invented (states are the supplied placements only; no winner, score or conclusion).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {minTextPx, neutralZonePatternTest} from './ambito-territorial-checks.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0143').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
const every = (fn, label, at = 1) => variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape})`})));
const ALT = presetsFor('LAW-0143').find(q => q.name === 'contrast-or-alternative').params;

contractSuite('LAW-0143', {
  continuity: ['pawnA', 'pawnB', 'handA', 'handB'],
  attach: [
    {from: 0, to: 1, a: 'handA', b: 'heldA', tol: 0.6},
    {from: 0, to: 1, a: 'handB', b: 'heldB', tol: 0.6},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 'neutral' && s.a.chip === 0 && s.a.holder === 'dish'", label: 'base: two identical complete scenes, neutral headers, empty zone slot, pawn in its dish'},
    {at: 0.3, fn: "s.a.chip > 0 && s.a.chipZone === s.zoneA && s.b.chipZone === s.zoneB && s.a.holder === 'dish' && s.b.holder === 'dish' && s.headers === 'neutral'", label: 'change: the zone chip supplied for each scene is clipped into the tag; nothing has moved; headers still neutral'},
    {at: 0.45, fn: "s.headers === 'scenario' && s.a.chip === 1 && s.b.chip === 1", label: 'the supplied scenario labels are shown only after the change'},
    {at: 0.55, fn: "s.a.holder === 'hand' && s.b.holder === 'hand' && s.heldA && s.heldB", label: 'parallel: the same hand carries each pawn at the same time'},
    {at: 1, fn: "s.a.holder === 'board' && s.b.holder === 'board' && s.slotZoneA === s.zoneA && s.slotZoneB === s.zoneB && s.zoneA !== s.zoneB", label: 'the changed datum changes the tile: each pawn ends on a tile of the zone supplied for it'},
    {at: 1, fn: "s.relA === 'shared' && s.relB === 'different' && s.a.ringS === 1 && s.b.ringD === 1 && s.a.ringD === 0 && s.b.ringS === 0", label: 'A: same zone as the text (solid ring); B: another zone (dashed ring) — as supplied'},
    {at: 1, fn: 's.trayFly === 1 && s.guideShown === 1 && s.noteShown === 1 && s.allReached', label: 'guide: the chips are joined and the neutral note is shown'},
    {at: 1, params: ALT, fn: "s.relA === 'different' && s.relB === 'shared' && s.slotZoneA === s.zoneA && s.slotZoneB === s.zoneB", label: 'alternative: three zones; B shares the text’s zone, A does not'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', zone: 'Zone Alder (fictional)'}}, fn: "s.relA === s.relB && s.slotZoneA === s.slotZoneB && JSON.stringify({...s.lookA, header: 0}) === JSON.stringify({...s.lookB, header: 0})", label: 'identical supplied zones give identical scenes (nothing invented)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.a.ringS === 1 && s.b.ringD === 1 && s.slotZoneA === s.zoneA && s.slotZoneB === s.zoneB", label: 'labels hidden: the same difference is visible'},
    // 16:9 side by side (>= 40 %), 9:16 stacked at full width; 1:1 stacks the two scenes in a column beside the
    // shared column (the layout of accepted LAW-0131), each scene >= 40 % of the width
    ...every("s.panelsSideBySide ? s.panelShare >= 0.4 : s.panelShare >= 0.9 || (s.panelShare >= 0.4 && s.sceneColumn)", 'each scene is at least 40% of the width side by side, full width when stacked alone'),
    ...every("s.a.holder === 'board' && s.b.holder === 'board' && s.slotZoneA === s.zoneA && s.slotZoneB === s.zoneB", 'both pawns reach a tile of their supplied zone'),
  ],
});

identicalBeforeChange('LAW-0143', 0.17);

// Every supplied field — the shared hierarchy, sources, passage, zones, shared facts, attributed reading, the fact,
// both scenarios and the comparison labels — is readable at the hold in every preset × ratio (no fold, standard floors).
suppliedTextSuite('LAW-0143', {
  fields: 'return [...p.sources.map(x => x.title), ...p.sources.map(x => x.note), ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, p.passages[0].zone, ...p.zones.map(z => z.name), ...p.sharedFacts, ...p.interpretations.map(q => q.text), p.fact.label, p.scenarioA.label, p.scenarioA.caption, p.scenarioA.zone, p.scenarioB.label, p.scenarioB.caption, p.scenarioB.zone, p.changedFact, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  content: 'return [...p.sources.map(x => x.title), ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, ...p.zones.map(z => z.name), ...p.sharedFacts, p.fact.label, p.scenarioA.label, p.scenarioB.label, p.scenarioA.zone, p.scenarioB.zone, p.changedFact];',
  captions: 'return [p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.locale === "es" ? "Según lo aportado · sin conclusión" : "As supplied · no conclusion drawn"];',
});

// review fixes: no fold (the scenes keep their size from the first frame), the slip lies on both boards, the tags
// stay open at the hold, no word is split, nothing under 16 px
ratioChecks('LAW-0143', 'no fold, slip on both boards, open tags, whole words', [
  {at: times(0, 1, 0.05), fn: 's.sceneScale === 1', label: 'the scenes keep their full size from the first frame (no shrink / jump)'},
  {at: [0, 1], fn: 's.slipOnBoards', label: 'the article slip lies on both boards'},
  // round-2: every pawn and the slip lie wholly inside a single zone (no border touches them), and the boards
  // fill their panels (each board >= 38 % of the frame width side by side)
  {at: [1], fn: 's.interior && s.slotZoneA === s.zoneA && s.slotZoneB === s.zoneB', label: 'every pawn and the slip lie wholly inside their zone, clear of every border'},
  {at: [1], fn: 's.panelsSideBySide ? s.boardShare >= 0.38 : true', label: 'side by side, each board fills its panel (>= 38 % of the width)'},
  {at: [1], fn: 's.a.tagOpen === 1 && s.b.tagOpen === 1', tv: ['all'], label: 'both tags are open at the hold'},
  {at: [1], fn: 's.brokenWords.length === 0', tv: ['all'], label: 'no supplied word is split across lines'},
  {at: [0.06, 1], dom: minTextPx(16), tv: ['all'], label: 'no visible text under 16 px'},
]);
neutralZonePatternTest('LAW-0143');
