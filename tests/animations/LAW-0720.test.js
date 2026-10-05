// LAW-0720 — Distribución ilustrativa de pérdidas · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens shows a real, magnified copy of the focus
// column drawn in the context's own coordinates; magnification >= 1.5), the change is localized (only the focus piece's
// length and its value change; every other piece keeps its length) and seeking back restores the old datum exactly
// (pure frame: the contract's seek-order determinism plus the before-value checks below).
// Windows (LAW-0720.js W): legend 0–0.04 · pieces settle 0.03–0.14 · values 0.12–0.18 · lens opens 0.22–0.36 · old value
// lifts out 0.46–0.52 · piece length 0.50–0.62 · new value 0.58–0.64 · "before" line 0.62–0.68 · lens closes 0.76–0.86
// · marker 0.85–0.90 · note 0.86–0.90 · key 0.88–0.92.
// Legal (causation-10 brief): no apportionment doctrine, no computed percentage, no fault; one supplied datum replaced
// by the supplied alternative datum, the old one kept traceable; neutral changed-datum marker (Δ on the accent disc).
// Brief customizable fields: events, causalLinks, alternatives, losses, focusTarget, beforeValue, afterValue,
// detailGeometry, contextLabels — all present; 'unit' and 'allocationLabels' added.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {sweep, textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, inFrameSweep, sceneAreaShare, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest} from './distribucion-perdidas-checks.js';

const ID = 'LAW-0720';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['seg0', 'seg1'],
  semantic: [
    {at: 0, fn: "s.beat === 'build' && s.lensOpen === 0 && s.shownValue !== 'after@context'", label: 'build: no lens, the old value'},
    {at: 0.2, fn: "s.settled === 1 && s.lensOpen === 0 && s.shownValue === 'before@context'", label: 'the produced state with the supplied values'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.shownValue === 'before@lens' && s.zoom >= 1.5", label: 'isolate: the lens holds the only copy of the value (magnified >= 1.5×)'},
    {at: 0.4, fn: 'Math.abs(s.dest.w / s.source.w - s.zoom) < 0.01 && Math.abs(s.dest.h / s.source.h - s.zoom) < 0.01', label: 'the lens is a uniform magnification of its source region'},
    {at: 0.7, fn: "s.shownValue === 'after@lens' && s.traceShown && s.focusWidth === s.afterWidth", label: 'replace: the new value and the piece length, the old value traceable'},
    {at: 0.7, fn: 's.widths.every((w, i) => i === s.focus || w === s.widths[i])', label: 'localized: the other pieces keep their lengths'},
    {at: 1, fn: "s.lensOpen === 0 && s.shownValue === 'after@context' && s.traceShown && s.markerShown && s.keyShown", label: 'back: context with the new value, the trace line, the marker and the key'},
    {at: 0.3, fn: 's.focusWidth === s.beforeWidth', label: 'seeking back before the change restores the old length exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.focus === 2 && s.afterWidth > s.beforeWidth', label: 'alternative: the third event, its piece grows'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.focusWidth === s.afterWidth && s.markerShown', label: 'labels hidden: the same substitution'},
  ],
});

// localized change over the whole run: every non-focus piece keeps its length at every sampled u
sweep(ID, 'only the focus piece changes length (rendered semantics, every u)', `
  let first = null;
  for (let u = 0; u <= 1.0001; u += 0.02) {
    x.seek(Math.min(1, u) * x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    const others = s.widths.filter((w, i) => i !== s.focus).join();
    if (first === null) first = others; else if (others !== first) out.push(tag + ' u=' + u.toFixed(2) + ': other pieces changed');
  }
`);

// the lens window: >= 1.5× and its smaller side >= 0.35 of the frame's short side while open (rendered)
sweep(ID, 'lens is a real inspection (rendered size)', `
  x.seek(0.55 * x.durationMs);
  const w = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect();
  const F = frameBox();
  const m = Math.min(w.width, w.height) / Math.min(F.width, F.height);
  if (m < 0.35) out.push(tag + ': lens smaller side ' + m.toFixed(3) + ' of the frame short side');
  return 'lens ' + m.toFixed(3);
`);

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: '!s.problems', label: 'a real composition is found (no fallback)'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.2, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own (lens closed)'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.losses[0].label, ...(p.losses[1] ? [p.losses[1].label] : []), ...p.events.map(e => e.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.afterValue, p.contextLabels.context, p.contextLabels.marker, p.allocationLabels.a, p.allocationLabels.b]",
  content: "return [...p.events.map(e => e.label), p.afterValue]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});
// the before value (the replaced datum) is drawn while the lens holds it
suppliedTextSuite(ID, {
  fields: 'return [p.beforeValue]',
  at: [0.4],
  keyNote: false,
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'no red (rendered)', [
  {at: [0.5, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

restHoldFill(ID, [0.1, 1]);
thinContent(ID);
subjectHeight(ID, [['rail', 'shelf', 'trays', 'floor']], [0.1, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
sceneAreaShare(ID, ['rail', 'shelf', 'trays', 'floor'], [0.1, 1], 0.2);
chipsClearOfProps(ID, '^(band-.*|valg\\d+|valAfterg|traceg)$', '^(seg\\d+|blade\\d+|tray\\d+|shelf|rail|marker)$', [0.1, 0.2, 0.9, 1]);

bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
lineBreakTest(ID);
noEnglishTest(ID);
