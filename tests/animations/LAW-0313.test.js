// LAW-0313 — Conclusiones de las partes · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (each party's raised hand is the solved hand;
// every link starts on its own card's lower edge and lands on its own exhibit's upper edge, its marker riding the tip)
// and the transformation (both cards linked to the exhibits they invoke) recognisable with labels hidden.
// Timing (u): rest 0–0.16 · both parties raise a hand towards their own card 0.16–0.227 · first link of A and of B
// 0.250–0.420 (the same window) · second links 0.457–0.627 · hands down 0.675–0.72 · notes 0.75–0.80 · state tag
// 0.76–0.81; still from 0.81 (the wall clock, a room fixture, comes to rest at 0.94).
// Legal: a link only means "invoked by the party (as supplied)"; ● (A) and ◆ (B) have equal ink; both cards the same
// size, both parties at identical lecterns, the same pace and the same number of links on both sides; nothing is
// proved, weighed or decided; no order of speaking, time limit, winner or outcome; jurisdiction unspecified.
// People floors (coordinator; hearings measure the FIGURE height): >= 60 px off 1:1; >= 55 px at 1:1 except
// long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, cpConsistencyTest, glyphSideTest, noTwinTextTest, placesKeptTest, linksAnchoredTest, gluedNumbersTest, noOneSideHighlightTest, ES_WORDS, FLOOR_FOR} from './conclusiones-partes-checks.js';

const ID = 'LAW-0313';
const eq = "s.drawA.every((q, j) => j >= s.drawB.length || q === s.drawB[j])";

contractSuite(ID, {
  continuity: ['handA', 'handB', 'tipA', 'tipB'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.linkState === 'none' && s.signalling === 0", label: 'rest: both cards on the board, the exhibits on the table; nobody signals; no link'},
    {at: 0.155, fn: "s.linkState === 'none' && s.signalling === 0", label: 'nothing happens during the rest beat'},
    {at: 0.235, fn: "s.signalling > 0.9 && s.linkState === 'none'", label: 'both parties raise a hand towards their card before any link runs (cause before effect)'},
    {at: 0.33, fn: `s.drawA[0] > 0 && s.drawA[0] < 1 && ${eq} && s.drawA[1] === 0`, label: 'the first link of A and of B run at the same pace'},
    {at: 0.44, fn: `s.drawA[0] === 1 && s.drawB[0] === 1 && s.drawA[1] === 0 && s.drawB[1] === 0`, label: 'the first links have landed before the second ones start'},
    {at: 0.55, fn: `s.drawA[1] > 0 && s.drawA[1] < 1 && ${eq}`, label: 'the second links run, again at the same pace on both sides'},
    {at: 1, fn: "s.linkState === 'linked' && s.drawA.every(q => q === 1) && s.drawB.every(q => q === 1) && s.signalling === 0 && s.finalState === 'linked' && s.allReached && s.problems.length === 0", label: 'hold: every supplied link drawn; hands down; the composition fits'},
    {at: 1, fn: "s.cardSize.a[0] === s.cardSize.b[0] && s.cardSize.a[1] === s.cardSize.b[1] && s.linksA.length === s.linksB.length", label: 'equal weight: the two cards have the same size; the same number of links'},
    {at: 0.55, params: {textVisibility: 'none'}, fn: `s.linkState === 'linking' && s.drawA[1] > 0 && ${eq}`, label: 'labels hidden: the same links run at the same pace'},
    {at: 1, params: {finalState: 'arguments-only'}, fn: "s.linkState === 'none' && s.signalling === 0", label: 'supplied final state: the arguments stay on the board without links'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.linkState === 'linking'", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sequence: [1, 0]}, fn: "s.order === '1>0' && s.boardLeft === 'b' && s.cardB.x < s.cardA.x", label: 'the supplied sequence decides the order of the cards on the board'},
    {at: 0.1, fn: "s.linkState === 'none' && s.signalling === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const ln = p.finalState !== 'arguments-only'; return [...(p.stateCaption ? [p.stateCaption] : []), p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.states.a, p.states.b, p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.table, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits];',
  captions: 'return [p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.table, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, equal pace on both sides, composition fits', [
  {at: times(0.16, 0.74, 0.005), fn: `${eq}`, label: 'the j-th link of A and the j-th link of B are always at the same point'},
  {at: times(0.16, 0.74, 0.005), fn: "s.linkState === 'none' || s.signalling > 0 || s.linkState === 'linked'", label: 'links only run while the parties hold their hands up'},
  {at: times(0.16, 0.74, 0.005), fn: 's.drawA.every((q, j) => j === 0 || q === 0 || s.drawA[j - 1] === 1)', label: 'one link at a time per side: a link starts once the previous one has landed'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.16, 0.74, 0.01), fn: 's.allReached', label: 'the raised hands stay within the arm'},
]);

const PROPS = ['[data-node="rm-board-body"]', '[data-node^="rm-card-"][data-node$="-body"]', '[data-node^="rm-exhibit"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]', '[data-node="rm-table"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node^="rm-p"][data-node$="-head"]', '[data-node^="rm-link-"][data-node$="-m"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node="rm-board"]', '[data-node="rm-links"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 72, table: 'none'});
equalWeightTest(ID, {at: [0.1, 1], chips: [['[data-node="rm-card-a"]', '[data-node="rm-card-b"]']], marks: [['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type'], ['[data-node="rm-card-a-g"]', '[data-node="rm-card-b-g"]'], ['[data-node="rm-link-a0-g"]', '[data-node="rm-link-b0-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
cpConsistencyTest(ID);
glyphSideTest(ID);
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.55, 0.62, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="lab"][data-node$="-lead"]', 'path[data-node^="rm-link-"]']});
textLinesVisibleTest(ID);
placesKeptTest(ID);
linksAnchoredTest(ID);
gluedNumbersTest(ID);
noOneSideHighlightTest(ID);

// Item 20 (hearings-09 fix, 2026-10-05): long-labels-stress supplies its final state and a hold caption longer than the
// baseline's — rendered at the hold in every ratio, the stress state tag is strictly longer than the default one.
test(`${ID}: long-labels-stress supplies finalState and a hold caption longer than the baseline's (rendered)`, async ({page}) => {
  const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  expect(stress.finalState).toBe('linked');
  expect(typeof stress.stateCaption).toBe('string');
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, stress]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1920]]) {
      const tag = {};
      for (const [k, params] of [['base', {}], ['stress', stress]]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params}); await x.ready; x.seek(x.durationMs);
        const n = x.element.querySelector('[data-node="state-tag"]');
        tag[k] = n ? [...n.querySelectorAll('tspan')].map(q => q.textContent.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ') : '';
        x.destroy(); el.remove();
      }
      res.push(tag);
    }
    return res;
  }, [ID, stress]);
  for (const t of out) {
    expect(t.stress).toBe(stress.stateCaption);
    expect(t.stress.length).toBeGreaterThan(t.base.length);
  }
});

// Equal weight, rendered: the two cards have the same rendered size, stroke and text size; every link line has the
// same colour and width; at every u the two sides have drawn the same length (equal counts) — 60 fps.
test(`${ID}: the two sides are drawn alike — same card size and text size, same line colour and width, same drawn length at every frame`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const A = box(node(svg, 'rm-card-a-body')), B = box(node(svg, 'rm-card-b-body'));
    if (Math.abs(A.w - B.w) > 0.5 || Math.abs(A.h - B.h) > 0.5) out.push(tag + ': cards ' + A.w.toFixed(1) + 'x' + A.h.toFixed(1) + ' vs ' + B.w.toFixed(1) + 'x' + B.h.toFixed(1));
    const ta = node(svg, 'rm-card-a-text'), tb = node(svg, 'rm-card-b-text');
    if (ta && tb) { const fa = parseFloat(getComputedStyle(ta.querySelector('text')).fontSize) * ta.getScreenCTM().a, fb = parseFloat(getComputedStyle(tb.querySelector('text')).fontSize) * tb.getScreenCTM().a; if (Math.abs(fa - fb) > 0.05) out.push(tag + ': card text ' + fa.toFixed(2) + ' vs ' + fb.toFixed(2)); }
    const lines = nodes(svg, /^rm-link-[ab]\\d+$/);
    const st = new Set(lines.map(l => l.getAttribute('stroke') + '|' + l.getAttribute('stroke-width')));
    if (st.size > 1) out.push(tag + ': link strokes differ ' + [...st].join(' / '));
    const len = s => nodes(svg, new RegExp('^rm-link-' + s + '\\\\d+$')).filter(l => eff(svg, l) > 0.05).reduce((a, l) => a + l.getTotalLength(), 0);
    let worst = 0;
    const s0 = x.getState({bounds: false}).semantic;
    if (s0.linksA.length === s0.linksB.length) for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      const fa = s.drawA.reduce((a, q) => a + q, 0), fb = s.drawB.reduce((a, q) => a + q, 0);
      worst = Math.max(worst, Math.abs(fa - fb));
    }
    stat('worst progress gap A-B ' + ratio, Math.round(worst * 1000) / 1000, 'max');
    if (worst > 1e-6) out.push(tag + ': the sides are not at the same progress (' + worst + ')');
    void len;
    return out;`, {}, {withHidden: true});
  report(ID, 'equal sides', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The action is recognisable with the labels hidden: both raised hands, then the lines from each card to the exhibits
// it invokes with the side's marker on each exhibit; nothing written anywhere in the room.
test(`${ID}: labels hidden — both parties raise a hand, every link runs from its card to its exhibit with its marker; no text`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none'}});
    await x.ready;
    const svg = x.element;
    const op = e => { if (!e) return 0; let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
    x.seek(0); const h0 = x.getState({bounds: false}).semantic;
    x.seek(0.23 * x.durationMs); const h1 = x.getState({bounds: false}).semantic;
    x.seek(x.durationMs);
    const lines = [...svg.querySelectorAll('[data-node^="rm-link-"]')].filter(e => /^rm-link-[ab]\d+$/.test(e.getAttribute('data-node')));
    const marks = [...svg.querySelectorAll('[data-node^="rm-link-"]')].filter(e => /-m$/.test(e.getAttribute('data-node')));
    return {raisedA: Math.hypot(h1.handA.x - h0.handA.x, h1.handA.y - h0.handA.y), raisedB: Math.hypot(h1.handB.x - h0.handB.x, h1.handB.y - h0.handB.y), lines: lines.map(op), lens: lines.map(l => l.getTotalLength()), marks: marks.map(op), text: [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length};
  }, ID);
  expect(out.raisedA).toBeGreaterThan(10);
  expect(out.raisedB).toBeGreaterThan(10);
  expect(out.lines.length).toBe(4);
  expect(Math.min(...out.lines)).toBeGreaterThan(0.95);
  expect(Math.min(...out.lens)).toBeGreaterThan(60);
  expect(Math.min(...out.marks)).toBeGreaterThan(0.95);
  expect(out.text).toBe(0);
});

void presetsFor;
