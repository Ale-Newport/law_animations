// LAW-0699 — Daño material · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete lanes: table, object, clipboard, plotter), exactly the
// indicated fact changes (only B's object changes to its altered state; before 0.20 both lanes are identical, with labels
// shown and hidden) and no legal consequence is invented (no cause is shown for the change; neutral note; no winner).
// Windows (LAW-0699.js W): heads 0.02–0.10 · shared chips 0.04–0.12 · B's crack 0.20–0.30, chip 0.27–0.37 (panel
// scratches 0.28–0.38) · plotters to the row 0.42–0.47 · write 0.47–0.66 · park 0.66–0.72 · rings 0.77–0.81 · guide
// 0.79–0.84 · notes 0.82–0.87 · key 0.84–0.89 (hold ≥ 820 ms).
// coordinator decision 2026-09-26 (standing stress cap rule, AUTHORING item 20; LAW-0687/0689–0692 precedent; see
// SESSION_HANDOFF): after trying the fallback layouts (incl. a right-hand text column beside stacked scenes at 1:1), the
// long-labels-stress COUNTS are capped (two entries, one shared fact — the baseline counts — one alternative, one link)
// with every text at near-maximum length (measurements in LAW-0699.presets.json); every field stays longer than the baseline.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate} from './dano-material-checks.js';

const ID = 'LAW-0699';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tipA', 'tipB', 'chipB'],
  semantic: [
    {at: 0, fn: '!s.changedA && !s.changedB && s.written.every(w => w === 0)', label: 'base: both objects intact, nothing written'},
    {at: 0.19, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'the two scenes are identical before the change beat'},
    {at: 0.4, fn: 's.changedB && !s.changedA && s.lookB.a === 1 && s.lookB.b === 1', label: 'only B has changed (both marks) by 0.40; A is untouched'},
    {at: 0.56, fn: 's.written[0] === s.written[1] && s.written[0] > 0 && s.written[0] < 1', label: 'both plotters write in parallel (same progress)'},
    {at: 1, fn: '!s.changedA && s.changedB && s.written.every(w => w === 1) && s.guideShown && s.keyShown', label: 'hold: only B altered; both rows written; guide and key shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.kind === 'panel' && s.changedB && !s.changedA", label: 'alternative: the panel changes only in B'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.changedB && !s.changedA && s.written.every(w => w === 1)', label: 'labels hidden: the same change and parallel action'},
  ],
});

identicalBeforeChange(ID, 0.2);

// Lane shares are measured on the RENDERED lanes against the frame as drawn (viewBox × screen scale): >= 0.40 of the
// frame width side by side, >= 0.71 stacked, >= 0.55 stacked beside a right-hand text column (coordinator thresholds
// 2026-09-26, AUTHORING item 20).
// A scene = its floor slab(s), table, object and clipboard (the header chip's width follows its own label).
const LANE_SHARE = "(() => { const vb = svg.viewBox.baseVal, m = svg.getScreenCTM(), FW = vb.width * Math.abs(m.a); const box = n => { const bs = ['floor', 'floor2', 'table', 'obj', 'r'].map(k => svg.querySelector('[data-node=\"' + k + n + '\"]')).filter(Boolean).map(e => e.getBoundingClientRect()); const l = Math.min(...bs.map(q => q.left)), rr = Math.max(...bs.map(q => q.right)), t = Math.min(...bs.map(q => q.top)); return {left: l, top: t, width: rr - l}; }; const a = box('A'), b = box('B'); const side = Math.abs(a.top - b.top) < 40; const sh = svg.querySelector('[data-node=\"band-sharedHead\"]'); const col = !side && sh && sh.getBoundingClientRect().left > Math.max(a.left + a.width, b.left + b.width) - 1; const need = side ? 0.40 : col ? 0.55 : 0.71; return a.width / FW >= need && b.width / FW >= need; })()";

ratioChecks(ID, 'layout and lane shares (rendered, of the FRAME)', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
  {at: [0, 1], dom: LANE_SHARE, label: 'each scene spans >= 0.40 of the frame width side by side, >= 0.71 stacked, >= 0.55 stacked beside a text column'},
  {at: [0, 1], dom: "(() => { const same = (x, y) => { const a = svg.querySelector('[data-node=\"' + x + '\"]').getBoundingClientRect(), b = svg.querySelector('[data-node=\"' + y + '\"]').getBoundingClientRect(); return Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1; }; return same('floorA', 'floorB') && same('tableA', 'tableB') && same('rA', 'rB'); })()", label: 'the two scenes have the same size (floor, table, clipboard)'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], tv: ['all'], dom: "(() => { const t = n => svg.querySelector('[data-node=\"' + n + '\"] text'); return t('hA') && t('hB') && t('hA').getAttribute('font-size') === t('hB').getAttribute('font-size'); })()", label: 'the A and B header chips use the same text size'},
  {at: [1], dom: "(() => { const r0 = n => svg.querySelector('[data-node=\"' + n + '\"]').getBoundingClientRect(); const a = r0('ringA'), b = r0('ringB'), oa = r0('objA'), ob = r0('objB'); return Math.abs(a.width - b.width) < 0.5 && Math.abs((a.left - oa.left) - (b.left - ob.left)) < 1.5 && Math.abs((a.top - oa.top) - (b.top - ob.top)) < 1.5; })()", label: 'the rings mark the same spot on both objects (same size and offset)'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.object.before, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.object.before, p.changedFact, ...p.sharedFacts]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5);
textSizeOverTime(ID);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Incident|Object|record|before|after|supplied|conclusion|Changed|Same|winner|differs)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

coldCreate(ID);
