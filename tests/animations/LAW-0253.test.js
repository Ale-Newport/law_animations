// LAW-0253 — Comunicación a la contraparte · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (the file rides A's hand, then the carrier's clip,
// then B's hand — SOLVED hand positions) and a transformation recognisable with the labels hidden.
// Clock: c = (u − 0.15) / 0.65 (c = 1 at u = 0.80). Windows (c → u): A reaches 0–0.07 → 0.15–0.1955; A lifts the file
// into the clip 0.07–0.13 → 0.1955–0.2345; A lets go 0.13–0.18; the carrier runs the route 0.19–0.84 → 0.2735–0.696
// (a pause at each stop; each leg's calendar cell opens as the leg completes); B reaches 0.84–0.89 → 0.696–0.7285;
// B lowers the file into the tray 0.89–0.94 → 0.7285–0.761; B lets go 0.94–1 → 0.761–0.80. The supplied final
// state (● documented / ◆ questioned with the dashed disputed marker on the supplied leg) shows 0.82–0.87.
// Legal: the route, its stops and dates are supplied; the order is "Sequence as configured (illustrative)"; no valid
// method, deadline, "deemed" service or effect; dashes only on the disputed marker; no arrows.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT} from './requerimiento-previo-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, headSizeTest, neutralityTest, noArrowsTest,
  seekHistoryTest, blankWindowTest, esDefaultsTest, chipsOffTest, fillTest, RATIOS,
} from './comunicacion-contraparte-checks.js';

const ID = 'LAW-0253';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const near = (a, b, tol = 1.5) => `Math.hypot(s.${a}.x - s.${b}.x, s.${a}.y - s.${b}.y) < ${tol}`;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'file', 'carrier'],
  attach: [
    {from: 0.196, to: 0.234, a: 'grip', b: 'handA', tol: 1.5},
    {from: 0.729, to: 0.76, a: 'grip', b: 'handB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.docAt === 'A' && s.holder === 'trayA' && s.legsDone === 0 && s.tags.outcome === 0 && s.badgeShown === 0", label: 'rest: the file stands in A’s out-tray; no leg is done; no state shown'},
    {at: 0.215, fn: `s.holder === 'handA' && ${near('grip', 'handA')}`, label: 'Party A lifts the file by its edge into the clip'},
    {at: 0.45, fn: "s.docAt === 'route' && s.holder === 'clip' && s.legsDone >= 1 && s.tags.outcome === 0", label: 'the file travels on the route; the first leg is done; no state yet (cause before effect)'},
    {at: 0.745, fn: `s.holder === 'handB' && ${near('grip', 'handB')}`, label: 'Party B takes the file from the clip and lowers it into the tray'},
    {at: 0.81, fn: "s.docAt === 'B' && s.holder === 'trayB' && s.legsDone === s.legs && s.lamps.every(v => v === 1)", label: 'the file lies in B’s in-tray; every leg is done and every stop was passed'},
    {at: 1, fn: "s.plan === 'documented' && s.badgeShown === 1 && s.markerShown === 0 && s.tags.outcome === 1 && s.allReached && s.problems.length === 0", label: 'hold: the supplied state "documented" (●); no disputed marker; composition clean'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.plan === 'questioned' && s.markerShown === 1 && s.badgeShown === 1 && s.questionedLeg === 3 && s.problems.length === 0", label: 'questioned (as supplied): ◆ and the dashed disputed marker on the supplied leg, nothing else'},
    {at: 0.3, fn: "s.docAt !== 'B' && s.tags.outcome === 0", label: 'seeking back restores the earlier state'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.docAt !== 'B' && s.tags.outcome === 0 && s.badgeShown === 0", label: 'actionProgress freezes the action part-way (no state is shown)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.docAt === 'B' && s.holder === 'trayB' && s.legsDone === s.legs", label: 'labels hidden: the same transformation is visible'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.problems.length === 0 && s.allReached', label: `${n}: clean composition, every hand reaches`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const q = p.finalState === 'questioned'; const n = p.stages.length + 1; const legs = Array.from({length: n}, (_, i) => p.dates.legs[i] ?? '—'); return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.stages, ...legs, p.objectLabels.outTray, p.objectLabels.inTray, p.objectLabels.calendar, p.objectLabels.route, q ? p.objectLabels.questioned : p.objectLabels.documented, ...p.annotations.map(a => a.text)];",
  content: "const q = p.finalState === 'questioned'; return [...p.stages, p.documents.caseFile.ref, q ? p.objectLabels.questioned : p.objectLabels.documented];",
  captions: "return [p.objectLabels.route];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden)
const PROPS = '[data-node="st-ta-back"], [data-node="st-ta-front"], [data-node="st-tb-back"], [data-node="st-tb-front"], [data-node="st-file"], [data-node="st-carrier"], [data-node^="st-stop"], [data-node="st-calg"], [data-node="st-da-desk"], [data-node="st-db-desk"], [data-node="st-rail"], [data-node="st-cue"]';
const CHIPS = '[data-node$="-chip"], [data-node="key"]';

ratioChecks(ID, 'faces clear, cards own their text, in frame, hands off heads, heads off text, neutral markers', [
  {at: [0, 0.3, 0.5, 0.7, 0.85, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or text covers a head'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [0, 0.3, 0.5, 0.8, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: times(0.15, 0.8, 0.01), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head (reach, lift, take, lower)'},
  {at: times(0, 1, 0.02), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// ● documented / ◆ questioned get equal visual weight: the same chip (font, weight, card stroke), the same badge size;
// cue glyphs of equal ink (rendered, every ratio)
test(`${ID}: ● documented and ◆ questioned states get equal visual weight (chip, badge, cue ink)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async ([id, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [ratio, w, h] of ratios) {
      const get = async plan => {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {finalState: plan}});
        await x.ready; x.seek(x.durationMs);
        const svg = x.element, q = n => svg.querySelector(`[data-node="${n}"]`);
        const t = q('tag-outcome-chip-text'), card = q('tag-outcome-chip-card'), cue = q('tag-outcome-chip-cue'), badge = q('st-cue-mark');
        const b = e => e.getBoundingClientRect();
        const ink = e => e.tagName === 'circle' ? Math.PI * (b(e).width / 2) ** 2 : b(e).width * b(e).height / 2;
        const r = {font: parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a, weight: getComputedStyle(t).fontWeight, stroke: card.getAttribute('stroke') + card.getAttribute('stroke-width'), dash: card.getAttribute('stroke-dasharray'), cue: ink(cue), badge: ink(badge), fill: cue.getAttribute('fill') + badge.getAttribute('fill')};
        x.destroy(); el.remove();
        return r;
      };
      const A = await get('documented'), B = await get('questioned');
      if (Math.abs(A.font - B.font) > 0.2 || A.weight !== B.weight || A.stroke !== B.stroke || A.dash || B.dash || A.fill !== B.fill) out.push(`${ratio}: chips differ ${JSON.stringify(A)} vs ${JSON.stringify(B)}`);
      for (const k of ['cue', 'badge']) if (Math.max(A[k], B[k]) / Math.min(A[k], B[k]) > 1.12) out.push(`${ratio}: ${k} ink ${A[k].toFixed(0)} vs ${B[k].toFixed(0)}`);
    }
    return out;
  }, [ID, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node="st-file"]', '[data-node="st-carrier"]', '[data-node="st-cue"]', '[data-node$="-pa-nw"]', '[data-node$="-pb-nw"]']});
headSizeTest(ID, {min: 52, step: 0.02});
chipsOffTest(ID, {chips: CHIPS, props: PROPS, step: 0.02});
fillTest(ID, {at: [0, 0.5, 1], a: 0.9, b: 0.6});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
blankWindowTest(ID, {selectors: ['[data-node="st-wall"]', '[data-node^="tag-"]', '[data-node="key"]']});
coldCreateTest(ID);
esDefaultsTest(ID);
