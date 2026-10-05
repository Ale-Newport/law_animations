// LAW-0323 — Identificación de motivo · contrast. Contract battery + ID-specific rendered checks (copied from the
// hearings-10 contrast test, LAW-0319, and adapted; that file stays unchanged).
// acceptanceCheck (brief): both scenes exist; exactly the supplied fact changes (which of the party's two neutral labels —
// "Discrepancia fáctica" / "cuestión jurídica señalada" — is attached to the same located apartado); no legal consequence
// is invented.
// Timing (u): base 0–0.17 (both rooms identical, both boards empty) · introduce: in A card A (●), in B card B (◆) settles
// on its place 0.20–0.30; headers 0.20–0.26; changed fact 0.22–0.28 · action: hand to the magnifier 0.40–0.44, lift
// 0.44–0.465, scan 0.465–0.66 (the same apartados located in both rooms), laid back 0.66–0.68, hand lets go 0.68–0.71,
// lines 0.693–0.757 · guide 0.78–0.85.
// Legal (VERY HIGH risk): placeholder text only; A and B have equal weight (same rooms, size, timing, number of lines,
// ● / ◆ with equal ink, lane colours only on the A/B badges); neither label says an apartado is wrong; no appeal rule,
// admissibility, time limit, standard of review, outcome or jurisdiction. People floors (coordinator; hearings measure
// the FIGURE height): >= 60 px off 1:1; 1:1 >= 55 px baseline / >= 45 px long-labels-stress.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, imConsistencyTest, glyphSideTest, noTwinTextTest, placesKeptTest, linksAnchoredTest, gluedNumbersTest, noOneWordLineTest, noOneSideHighlightTest, lupaParkedClearTest, ES_WORDS, FLOOR_FOR} from './identificacion-motivo-checks.js';

const ID = 'LAW-0323';
const eq = 's.drawA.every((q, j) => j >= s.drawB.length || q === s.drawB[j])';

contractSuite(ID, {
  continuity: ['handA', 'handB', 'lupa', 'party'],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.lookA === s.lookB && s.tags === 0 && s.cardA === 0 && s.cardB === 0 && s.reaching === 0 && s.linkStateA === 'none' && s.linkStateB === 'none'", label: 'base: the two rooms are identical; both boards empty; nobody moves'},
    {at: 0.25, fn: "s.tags > 0.5 && s.cardState === 'coming' && s.cardA === s.cardB && s.reaching === 0 && s.linkStateA === 'none'", label: 'the one difference is introduced in both rooms at once: card A settles in A, card B in B'},
    {at: 0.35, fn: "s.cardState === 'placed' && s.reaching === 0 && s.linkStateA === 'none'", label: 'the cards are in place before the magnifier is taken'},
    {at: 0.55, fn: "s.carry === 1 && s.lookA === s.lookB && s.linkStateA === 'none'", label: 'the same scan runs in both rooms'},
    {at: 0.725, fn: `s.linkStateA === 'linking' && s.linkStateB === 'linking' && ${eq} && s.offA.every(q => q === 0) && s.offB.every(q => q === 0) && s.locK.every(q => q === 1)`, label: 'the same located apartados; then each room links its own card at the same pace'},
    {at: 1, fn: `s.linkStateA === 'linked' && s.linkStateB === 'linked' && s.guide === 1 && s.problems.length === 0 && s.lookA === s.lookB && s.linksA.join() === s.linksB.join() && s.lupaPhase === 'laid'`, label: 'hold: the same apartados linked to card A in A and card B in B; the guide drawn; the composition fits'},
    {at: 0.1, fn: "s.tags === 0 && s.guide === 0 && s.cardA === 0 && s.linkStateB === 'none' && s.lupaPhase === 'rest'", label: 'seeking back restores the base'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.speakers.map(s => s.label), ...p.grounds.map(s => s.text), ...p.decisions.sections, p.outcomes.a, p.outcomes.b, p.locatedCaption, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.sequence, p.labels.key];",
  content: 'return [...p.speakers.map(s => s.label), ...p.grounds.map(s => s.text), p.changedFact];',
  captions: 'return [p.labels.sequence, p.comparisonLabels.guide];',
});

ratioChecks(ID, 'identical except the contrasted item; equal pace; composition fits', [
  {at: times(0, 1, 0.02), fn: 's.lookA === s.lookB', label: 'everybody\'s place, the walk, the magnifier\'s path, the located frames and the apartados are identical in A and B at every u'},
  {at: times(0, 1, 0.005), fn: `${eq} && s.cardA === s.cardB`, label: 'the two rooms run at the same pace at every u'},
  {at: times(0, 1, 0.01), fn: 's.offA.every(q => q === 0) && s.offB.every(q => q === 0)', label: 'only the room\'s own card is ever linked in each room'},
  {at: times(0.4, 0.8, 0.005), fn: "s.linkStateA === 'none' || (s.cardA === 1 && (s.lupaPhase === 'laid' || s.lupaPhase === 'releasing'))", label: 'links only run once the card is in place and the magnifier laid back'},
  {at: times(0.3, 0.75, 0.005), fn: "s.carry === 0 || s.reaching > 0.99", label: 'the magnifier only moves in the hand'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
  {at: times(0.16, 0.8, 0.01), fn: 's.allReached', label: 'every reach is within the arm'},
]);

// The guide links the two contrasted cards through the free channel (rendered): it starts on room A's board at card A
// and ends on room B's board at card B; it never runs over a room floor.
test(`${ID}: the guide links card A in room A with card B in room B through free channels (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const g0 = node(svg, 'guide');
    if (!g0) return out;
    const m = g0.getScreenCTM(); const L = g0.getTotalLength();
    const P2 = t => new DOMPoint(g0.getPointAtLength(t).x, g0.getPointAtLength(t).y).matrixTransform(m);
    const near = (q, b, pad) => q.x >= b.l - pad && q.x <= b.r + pad && q.y >= b.t - pad && q.y <= b.b + pad;
    const A = P2(0), B = P2(L);
    const roomA = box(node(svg, 'ra-walls')), roomB = box(node(svg, 'rb-walls'));
    const cA = box(node(svg, 'ra-card-a-body')), cB = box(node(svg, 'rb-card-b-body'));
    const bA = box(node(svg, 'ra-board-body')), bB = box(node(svg, 'rb-board-body'));
    if (!near(A, bA, 3) || A.x < cA.l || A.x > cA.r) out.push(pr.name + ' ' + ratio + ': the guide does not start on room A\\'s board at card A');
    if (!near(B, bB, 3) || B.x < cB.l || B.x > cB.r) out.push(pr.name + ' ' + ratio + ': the guide does not end on room B\\'s board at card B');
    let inside = 0;
    for (let t = 0; t <= L; t += 3) { const q = P2(t); for (const R0 of [roomA, roomB]) if (q.x > R0.l + 20 && q.x < R0.r - 20 && q.y > R0.t + 20 && q.y < R0.b - 20) inside++; }
    stat('guide samples inside a room floor ' + ratio, inside, 'max');
    if (inside > 0) out.push(pr.name + ' ' + ratio + ': the guide runs over a room floor (' + inside + ' samples)');
    return out;`, {}, {withHidden: true});
  report(ID, 'guide', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Before the change beat the two rooms are pixel-identical in structure: every node of room A has the same rendered box
// as its twin in room B (shifted by the room offset), labels shown and hidden.
test(`${ID}: before the introduce beat the two rooms render identically (every node, labels shown and hidden)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const u of [0, 0.1, 0.165]) {
      x.seek(u * x.durationMs);
      const wa = box(node(svg, 'ra-walls')), wb = box(node(svg, 'rb-walls'));
      const dx = wb.l - wa.l, dy = wb.t - wa.t;
      for (const e of svg.querySelectorAll('[data-node^="ra-"]')) {
        const nm = e.getAttribute('data-node');
        // (the link groups hold each room's own, still invisible, links)
        if (/-links$/.test(nm) || e.closest('[data-node$="-links"]')) continue;
        const t = node(svg, 'rb-' + nm.slice(3));
        if (!t) { if (eff(svg, e) > 0.01) out.push(pr.name + ' ' + ratio + ': ' + nm + ' has no twin in B'); continue; }
        const oa = eff(svg, e), ob = eff(svg, t);
        if (Math.abs(oa - ob) > 0.01) { out.push(pr.name + ' ' + ratio + ' u=' + u + ': ' + nm + ' opacity ' + oa + ' vs ' + ob); continue; }
        if (oa < 0.01) continue;
        const a = box(e), b = box(t);
        if (Math.abs(a.l + dx - b.l) > 0.6 || Math.abs(a.t + dy - b.t) > 0.6 || Math.abs(a.w - b.w) > 0.6 || Math.abs(a.h - b.h) > 0.6) out.push(pr.name + ' ' + ratio + ' u=' + u + ': ' + nm + ' differs');
      }
    }
    return [...new Set(out)].slice(0, 20);`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Equal weight, rendered: in each room the laid-out card has the same size; the A and B links have the same colour and
// width, the same count, and at every frame the same drawn progress; the header glyphs have equal ink.
test(`${ID}: A and B are drawn alike — same card size, same line colour and width, same count, same progress at every frame`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const A = box(node(svg, 'ra-card-a-body')), B = box(node(svg, 'rb-card-b-body'));
    if (Math.abs(A.w - B.w) > 0.5 || Math.abs(A.h - B.h) > 0.5) out.push(tag + ': cards ' + A.w.toFixed(1) + 'x' + A.h.toFixed(1) + ' vs ' + B.w.toFixed(1) + 'x' + B.h.toFixed(1));
    const la = nodes(svg, /^ra-link-a\\d+$/), lb = nodes(svg, /^rb-link-b\\d+$/);
    if (la.length !== lb.length) out.push(tag + ': ' + la.length + ' links in A vs ' + lb.length + ' in B');
    const st = new Set([...la, ...lb].map(l => l.getAttribute('stroke') + '|' + l.getAttribute('stroke-width')));
    if (st.size > 1) out.push(tag + ': link strokes differ');
    let worst = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      worst = Math.max(worst, Math.abs(s.drawA.reduce((a, q) => a + q, 0) - s.drawB.reduce((a, q) => a + q, 0)), Math.abs(s.cardA - s.cardB));
    }
    stat('worst progress gap A-B ' + ratio, Math.round(worst * 1000) / 1000, 'max');
    if (worst > 1e-6) out.push(tag + ': A and B are not at the same progress (' + worst + ')');
    return out;`, {}, {withHidden: true});
  report(ID, 'equal sides', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="guide"]']});
noOverlapTest(ID, {markers: ['[data-node^="bA"]', '[data-node^="bB"]', '[data-node^="ra-link-"][data-node$="-m"]', '[data-node^="rb-link-"][data-node$="-m"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^r[ab]-p\\d$', floorFor: FLOOR_FOR});
headsClearTest(ID, {heads: '^r[ab]-p\\d-head$', covers: ['[data-node="ra-lupa-at"]', '[data-node="rb-lupa-at"]', '[data-node="guide"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node="ra-board"]', '[data-node="rb-board"]', '[data-node="ra-links"]', '[data-node="rb-links"]']});
armsClearTest(ID, {people: '^r[ab]-p(\\d)$', props: ['[data-node="ra-board-body"]', '[data-node="rb-board-body"]', '[data-node^="ra-exhibit"]', '[data-node^="rb-exhibit"]', '[data-node="ra-clock"]', '[data-node="rb-clock"]']});
equalWeightTest(ID, {at: [0.3, 1], marks: [['[data-node="hdrA-cue"]', '[data-node="hdrB-cue"]'], ['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type'], ['[data-node="ra-link-a0-g"]', '[data-node="rb-link-b0-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
imConsistencyTest(ID, {linksOf: q => ({a: q.routes.located, b: q.routes.located})});
glyphSideTest(ID, {prefixes: ['ra', 'rb']});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.5, 0.61, 0.65, 0.7, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="ra-walls"], [data-node="rb-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="guide"]', 'path[data-node^="ra-link-"]', 'path[data-node^="rb-link-"]']});
textLinesVisibleTest(ID);
placesKeptTest(ID, {rooms: ['ra', 'rb'], walker: true});
linksAnchoredTest(ID, {rooms: ['ra', 'rb']});
void presetsFor;
gluedNumbersTest(ID);
noOneWordLineTest(ID);
noOneSideHighlightTest(ID);

// Item 12 (review-01 fix): the magnifier laid back rests clear of the sheets, the located frames and the markers.
lupaParkedClearTest(ID, {rooms: ['ra', 'rb'], gap: 2});

// Item 18 (review-01 fix), rendered: side by side (16:9, 1:1) each room keeps >= 0.40 of the frame's width at the hold —
// labels shown and hidden, every preset — and stacked (9:16) >= 0.71; the shared text goes to a band, not beside them.
test(`${ID}: each room is a large subject — rendered share of the frame width at the hold`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    for (const p of ['ra', 'rb']) {
      const e = svg.querySelector('[data-node="' + p + '-walls"]');
      const s = e.getBoundingClientRect().width / F.width;
      const min = ratio === '9:16' ? 0.71 : 0.40;
      stat('room share ' + ratio, Math.round(s * 1000) / 1000);
      if (s < min) out.push(pr.name + ' ' + ratio + ': room ' + p + ' ' + s.toFixed(3) + ' of the frame width < ' + min);
    }
    return out;`, {}, {withHidden: true});
  report(ID, 'room share', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});
