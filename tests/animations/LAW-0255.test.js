// LAW-0255 — Comunicación a la contraparte · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the supplied state of one supplied leg:
// documented — solid outline, ● — in A; questioned in this configured example — the dashed disputed marker, ◆ — in B)
// and no legal consequence is invented (both files travel and arrive identically; no winner, validity or effect).
// Timing (u): base 0–0.17 (two identical scenes) · headers 0.17–0.23 · the change 0.24–0.32 · the same action in both
// scenes 0.40–0.77 (clock c = (u − 0.40) / 0.37) · the guide 0.78–0.83 · the neutral note 0.81–0.86.
// People (coordinator 2026-10-04: full-body floors are measured on the rendered FIGURE height): every figure >= 60 px
// tall in every preset × ratio (the stress preset at 1:1 keeps ~69 px figures with its near-maximum strip); non-stress
// presets at 1:1 also keep heads >= 55 px.
// Coordinator standing rule (AUTHORING item 20): the long-labels-stress preset is capped — one shared fact (77
// characters) and a 59-character changed fact — by the subject floor: uncapped, the strip leaves the scenes a band of
// 0.091 of the frame height at 1:1 (figures 69.6 px) and 0.102 at 9:16; capped, 0.274 and 0.201 (SCENE_HEIGHT below).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, headsAtLeast} from './requerimiento-previo-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, headSizeTest, neutralityTest, noArrowsTest,
  seekHistoryTest, blankWindowTest, esDefaultsTest, figureSizeTest, chipsOffTest, fillTest,
} from './comunicacion-contraparte-checks.js';

const ID = 'LAW-0255';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headerShown === 0 && s.changeShown === 0", label: 'base: two identical complete scenes; no header, no change yet'},
    {at: 0.3, fn: "s.headerShown === 1 && s.changeShown > 0 && s.a.docAt === 'A' && s.b.docAt === 'A' && s.same", label: 'introduce: headers and the localised change; both files still at Party A'},
    {at: 0.55, fn: "s.a.docAt === 'route' && s.same && s.guide === 0", label: 'parallel: both files travel identically; no guide yet'},
    {at: 1, fn: "s.a.docAt === 'B' && s.b.docAt === 'B' && s.same && s.guide === 1 && s.allReached && s.problems.length === 0", label: 'hold: both files arrive the same way (no consequence invented); the guide is drawn; composition clean'},
    {at: 1, fn: "s.lookA.state === 'documented' && s.lookB.state === 'questioned'", label: 'exactly the supplied state differs'},
    {at: 0.35, fn: "s.a.docAt === 'A' && s.guide === 0", label: 'seeking back restores the earlier state'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.same && s.guide === 1 && s.problems.length === 0", label: 'labels hidden: the same comparison'},
    ...['contrast-or-alternative', 'long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.problems.length === 0 && s.allReached && s.same', label: `${n}: clean composition, identical action`})),
  ],
});

identicalBeforeChange(ID, 0.24);

suppliedTextSuite(ID, {
  fields: "const n = p.stages.length + 1; const legs = Array.from({length: n}, (_, i) => p.dates.legs[i] ?? '—'); return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.stages, ...legs, p.objectLabels.outTray, p.objectLabels.inTray, p.objectLabels.calendar, p.objectLabels.route, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: "return [p.scenarioA.label, p.scenarioB.label];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// ---------------------------------------------------------------------------------------------
// rendered: each scene's drawn width over the frame's width (side by side >= 0.40, stacked >= 0.71); same size scenes
const SCENE_SHARE = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const FW = p1.x - p0.x;
  const bs = ['a-wall', 'b-wall'].map(n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect());
  const row = Math.abs(bs[0].top - bs[1].top) < 2;
  if (Math.abs(bs[0].width - bs[1].width) > 1 || Math.abs(bs[0].height - bs[1].height) > 1) return false;
  return bs.every(b => b.width / FW >= (row ? 0.40 : 0.71));
})()`;
// rendered: exactly the indicated fact changes — every drawn node of scene A has its twin in B at the same place
// relative to its scene (1 px), except the supplied-state marker, its cue glyph and the header text
const ONLY_THE_FACT = `(() => {
  const skip = /^(qmark|cue-mark|head-text.*|header)$/;
  const oa = svg.querySelector('[data-node="a-wall"]').getBoundingClientRect(), ob = svg.querySelector('[data-node="b-wall"]').getBoundingClientRect();
  for (const e of svg.querySelectorAll('[data-node^="a-"]')) {
    const k = e.dataset.node.slice(2);
    if (skip.test(k) || k === 'lane' || k === 'view') continue;
    const f = svg.querySelector('[data-node="b-' + k + '"]');
    if (!f) return 'missing b-' + k;
    const A = e.getBoundingClientRect(), B = f.getBoundingClientRect();
    if (Math.abs((A.left - oa.left) - (B.left - ob.left)) > 1 || Math.abs((A.top - oa.top) - (B.top - ob.top)) > 1 || Math.abs(A.width - B.width) > 1 || Math.abs(A.height - B.height) > 1) return 'moved ' + k;
    if ((e.getAttribute('opacity') || '1') !== (f.getAttribute('opacity') || '1')) return 'opacity ' + k;
  }
  // the marker changes in outline only: the same box, solid in A, dashed (the disputed marker) in B
  const qa = svg.querySelector('[data-node="a-qmark"]'), qb = svg.querySelector('[data-node="b-qmark"]');
  const A = qa.getBoundingClientRect(), B = qb.getBoundingClientRect();
  if (Math.abs(A.width - B.width) > 1.5 || Math.abs(A.height - B.height) > 1.5) return 'marker size';
  if (qa.hasAttribute('data-disputed') || !qb.hasAttribute('data-disputed')) return 'disputed flag';
  const dashed = el => [el, ...el.querySelectorAll('*')].some(z => (z.getAttribute('stroke-dasharray') || 'none') !== 'none');
  if (dashed(qa) || !dashed(qb)) return 'outline';
  return true;
})() === true`;
// ● / ◆ and the headers: equal ink and equal type
const EQUAL_WEIGHT = `(() => {
  const b = n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect();
  const ink = n => { const e = svg.querySelector('[data-node="' + n + '"]'); const r = b(n); return e.tagName === 'circle' ? Math.PI * (r.width / 2) ** 2 : r.width * r.height / 2; };
  for (const pair of [['a-cue-mark', 'b-cue-mark'], ['a-head-text-cue', 'b-head-text-cue']]) { const x = ink(pair[0]), y = ink(pair[1]); if (Math.max(x, y) / Math.min(x, y) > 1.12) return false; }
  const ca = b('a-cue'), cb = b('b-cue'); if (Math.abs(ca.width - cb.width) > 1.5) return false;
  const ta = svg.querySelector('[data-node="a-head-text-text"]'), tb = svg.querySelector('[data-node="b-head-text-text"]');
  if (!ta || !tb) return true;
  return getComputedStyle(ta).fontSize === getComputedStyle(tb).fontSize && getComputedStyle(ta).fontWeight === getComputedStyle(tb).fontWeight;
})()`;
// the guide runs through real channels: sampled along its drawn path it enters no head, no person, no visible text and no
// prop other than the two outlined legs' cues it ends on; it ends on the two rings (within 3 px)
const GUIDE_CLEAR = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const path = svg.querySelector('[data-node="guide-path"]');
  if (eff(path) < 0.5) return false;
  const m = path.getScreenCTM(), L = path.getTotalLength();
  const pts = []; for (let j = 0; j <= 200; j++) pts.push(path.getPointAtLength(L * j / 200).matrixTransform(m));
  const rings = [0, 1].map(i => { const r = svg.querySelector('[data-node="guide-ring' + i + '"]').getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2}; });
  const onRing = (q, R) => Math.abs(Math.hypot(q.x - R.x, q.y - R.y) - R.r) < 3;
  if (!onRing(pts[0], rings[0]) || !onRing(pts[pts.length - 1], rings[1])) return 'ends';
  const inside = (q, b, pad) => q.x > b.left + pad && q.x < b.right - pad && q.y > b.top + pad && q.y < b.bottom - pad;
  const avoid = [];
  for (const P of ['a', 'b']) {
    for (const k of ['pa', 'pb']) for (const part of ['head', 'upper', 'near', 'far']) { const e = svg.querySelector('[data-node="' + P + '-' + k + '-' + part + '"]'); if (e) avoid.push({n: e.dataset.node, b: e.getBoundingClientRect()}); }
    for (const k of ['file', 'carrier', 'ta-back', 'tb-back', 'da-desk', 'db-desk', 'calg']) { const e = svg.querySelector('[data-node="' + P + '-' + k + '"]'); if (e && eff(e) > 0.3) avoid.push({n: e.dataset.node, b: e.getBoundingClientRect()}); }
  }
  for (const t of svg.querySelectorAll('text')) if (eff(t) > 0.3 && t.textContent.trim()) avoid.push({n: 'text:' + t.textContent.slice(0, 20), b: t.getBoundingClientRect()});
  for (const q of pts) for (const a of avoid) if (inside(q, a.b, 1)) return 'crosses ' + a.n;
  return true;
})() === true`;

// subject floor (causation-05 decision): each scene's rendered stage (its wall) >= 0.20 of the frame height
const SCENE_HEIGHT = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const FH = (new DOMPoint(0, vb.y + vb.height).matrixTransform(m)).y - (new DOMPoint(0, vb.y).matrixTransform(m)).y;
  return ['a-wall', 'b-wall'].every(n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect().height / FH >= 0.2);
})()`;

ratioChecks(ID, 'scenes large and equal, only the fact changes, guide in channels, faces clear, in frame', [
  {at: [0, 0.5, 1], dom: SCENE_HEIGHT, label: 'RENDERED: each scene >= 0.20 of the frame height (subject floor)'},
  {at: [1], dom: SCENE_SHARE, label: 'RENDERED: both scenes the same size; each >= 0.40 of the frame width side by side, >= 0.71 stacked'},
  {at: [0.3, 0.6, 1], dom: ONLY_THE_FACT, label: 'RENDERED: every node of A has its twin in B at the same place; only the marker outline (solid / dashed disputed), its cue and the header differ'},
  {at: [0.3, 1], dom: EQUAL_WEIGHT, label: 'RENDERED: ● and ◆ cues of equal ink; headers in the same type'},
  {at: [0.84, 0.9, 1], dom: GUIDE_CLEAR, label: 'RENDERED: the guide ends on both rings and crosses no head, person, prop or text'},
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, header or text covers a head'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [0, 0.3, 0.5, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [0, 0.5, 1], ratios: ['1:1'], presets: ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'], dom: headsAtLeast(55), label: 'non-stress presets at 1:1: heads >= 55 px at 1080p (stricter than the figure floor)'},
  {at: times(0.4, 0.77, 0.01), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head'},
  {at: times(0, 1, 0.02), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node$="-file"]', '[data-node$="-carrier"]', '[data-node$="-cue"]', '[data-node$="-pa-nw"]', '[data-node$="-pb-nw"]']});
figureSizeTest(ID, {min: 60, step: 0.02});
chipsOffTest(ID, {chips: '[data-node$="-head-text"], [data-node^="strip-"]:not([data-node$="-wrap"]):not([data-node$="-card"]):not([data-node$="-text"]), [data-node="key"], [data-node="guide-label"]', props: '[data-node="a"], [data-node="b"]', step: 0.02});
fillTest(ID, {at: [0, 0.5, 1], a: 0.85, b: 0.5});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
blankWindowTest(ID, {selectors: ['[data-node="a-wall"]', '[data-node="b-wall"]', '[data-node="strip"]']});
coldCreateTest(ID);
esDefaultsTest(ID);
