// LAW-0317 — Lectura de resolución · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the reader's hand is the solved hand on the
// document; the document rises from the lectern to the table and the pieces come out of it; every line starts on its own
// card's lower edge and lands on its own paragraph's upper edge, its marker riding the tip) and the transformation (the
// document separated into its two sections and paragraphs) recognisable with labels hidden.
// Timing (u): rest 0–0.15 · hand to the document 0.15–0.21 · the document rises onto the table 0.21–0.37 · hand down
// 0.37–0.43 · separation 0.42–0.56 (both cards and every paragraph come out at the same pace; the document lets go
// 0.42–0.47) · lines 0.576–0.714 (all together) · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81 (the wall clock
// comes to rest at 0.94).
// Legal (VERY HIGH risk): the document carries only supplied placeholder text — no ruling, outcome, costs, reasons,
// appeal, time limit or jurisdiction; ● (A) and ◆ (B) have equal ink; both cards the same size, the same pace and the
// same number of lines; jurisdiction unspecified. People floors (coordinator; hearings measure the FIGURE height):
// >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, lrConsistencyTest, glyphSideTest, noTwinTextTest, placesKeptTest, linksAnchoredTest, gluedNumbersTest, noOneWordLineTest, noOneSideHighlightTest, ES_WORDS, FLOOR_FOR} from './lectura-resolucion-checks.js';

const ID = 'LAW-0317';
const eq = 's.drawA.every((q, j) => j >= s.drawB.length || q === s.drawB[j])';

contractSuite(ID, {
  continuity: ['hand', 'doc', 'tipA', 'tipB'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.docState === 'lectern' && s.split === 0 && s.linkState === 'none' && s.reaching === 0", label: 'rest: the closed document on the lectern; empty places; nobody moves; no line'},
    {at: 0.145, fn: "s.docState === 'lectern' && s.reaching === 0", label: 'nothing happens during the rest beat'},
    {at: 0.21, fn: "s.reaching > 0.99 && s.lift === 0", label: 'the hand reaches the document before it moves (cause before effect)'},
    {at: 0.3, fn: "s.docState === 'rising' && s.reaching > 0.99 && s.split === 0", label: 'the document rises from the lectern while the hand stays'},
    {at: 0.4, fn: "s.docState === 'open' && s.split === 0 && s.docScale > 1.5", label: 'the document lies open on the table, larger, before it separates'},
    {at: 0.5, fn: "s.split > 0 && s.split < 1 && s.cardInA === s.cardInB && s.linkState === 'none'", label: 'it separates: both cards and the paragraphs come out of it at the same pace'},
    {at: 0.65, fn: `s.split === 1 && s.linkState === 'linking' && ${eq}`, label: 'then the lines run, A and B at the same pace'},
    {at: 1, fn: "s.linkState === 'linked' && s.docState === 'separated' && s.reaching === 0 && s.finalState === 'separated' && s.allReached && s.problems.length === 0", label: 'hold: separated, every supplied line drawn; hand down; the composition fits'},
    {at: 1, fn: 's.cardSize.a[0] === s.cardSize.b[0] && s.cardSize.a[1] === s.cardSize.b[1] && s.linksA.length === s.linksB.length', label: 'equal weight: both cards the same size; the same number of lines'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.split > 0 && s.cardInA === s.cardInB', label: 'labels hidden: the same separation'},
    {at: 1, params: {finalState: 'sections-only'}, fn: "s.linkState === 'none' && s.split === 1", label: 'supplied state: the sections on the board without lines'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.split < 1", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sequence: [1, 0]}, fn: "s.order === '1>0' && s.boardLeft === 'b' && s.cardB.x < s.cardA.x", label: 'the supplied sequence decides the order of the sections on the board'},
    {at: 0.1, fn: "s.docState === 'lectern' && s.split === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...(p.stateCaption ? [p.stateCaption] : []), p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.states.a, p.states.b, p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.table, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits];',
  captions: 'return [p.actorLabels.participant, p.objectLabels.board, p.objectLabels.lectern, p.objectLabels.table, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, equal pace on both sides, composition fits', [
  {at: times(0, 1, 0.005), fn: `${eq} && s.cardInA === s.cardInB`, label: 'A and B are always at the same point'},
  {at: times(0, 0.42, 0.005), fn: "s.lift === 0 || s.reaching > 0.99 || s.lift === 1", label: 'the document only rises while the hand is on it'},
  {at: times(0.42, 0.8, 0.005), fn: "s.linkState === 'none' || s.split === 1", label: 'lines run only once the pieces are in place'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.15, 0.45, 0.01), fn: 's.allReached', label: 'the hand stays within the arm'},
]);

const PROPS = ['[data-node="rm-board-body"]', '[data-node^="rm-card-"][data-node$="-body"]', '[data-node^="rm-exhibit"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]', '[data-node="rm-table"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node^="rm-p"][data-node$="-head"]', '[data-node^="rm-link-"][data-node$="-m"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node="rm-board"]', '[data-node="rm-links"]', '[data-node="rm-doc"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 72, table: 'none'});
equalWeightTest(ID, {at: [0.1, 1], chips: [['[data-node="rm-card-a"]', '[data-node="rm-card-b"]']], marks: [['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type'], ['[data-node="rm-card-a-g"]', '[data-node="rm-card-b-g"]'], ['[data-node="rm-link-a0-g"]', '[data-node="rm-link-b0-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
lrConsistencyTest(ID);
glyphSideTest(ID);
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.5, 0.62, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="lab"][data-node$="-lead"]', 'path[data-node^="rm-link-"]']});
textLinesVisibleTest(ID);
placesKeptTest(ID);
linksAnchoredTest(ID);
gluedNumbersTest(ID);
noOneWordLineTest(ID);
noOneSideHighlightTest(ID);

// Item 20: long-labels-stress supplies its state and a hold caption longer than the baseline's — rendered at the hold in
// every ratio, the stress state tag is strictly longer than the default one.
test(`${ID}: long-labels-stress supplies finalState and a hold caption longer than the baseline's (rendered)`, async ({page}) => {
  const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  expect(stress.finalState).toBe('separated');
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

// Equal weight, rendered: the two cards have the same rendered size and text size; every line has the same colour and
// width; at every frame (60 fps) both sides have drawn the same and both cards have come out the same.
test(`${ID}: the two sections are drawn alike — same card size and text size, same line colour and width, same progress at every frame`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const A = box(node(svg, 'rm-card-a-body')), B = box(node(svg, 'rm-card-b-body'));
    if (Math.abs(A.w - B.w) > 0.5 || Math.abs(A.h - B.h) > 0.5) out.push(tag + ': cards ' + A.w.toFixed(1) + 'x' + A.h.toFixed(1) + ' vs ' + B.w.toFixed(1) + 'x' + B.h.toFixed(1));
    const ta = node(svg, 'rm-card-a-text'), tb = node(svg, 'rm-card-b-text');
    if (ta && tb) { const fa = parseFloat(getComputedStyle(ta.querySelector('text')).fontSize) * ta.getScreenCTM().a, fb = parseFloat(getComputedStyle(tb.querySelector('text')).fontSize) * tb.getScreenCTM().a; if (Math.abs(fa - fb) > 0.05) out.push(tag + ': card text ' + fa.toFixed(2) + ' vs ' + fb.toFixed(2)); }
    const st = new Set(nodes(svg, /^rm-link-[ab]\\d+$/).map(l => l.getAttribute('stroke') + '|' + l.getAttribute('stroke-width')));
    if (st.size > 1) out.push(tag + ': line strokes differ ' + [...st].join(' / '));
    let worst = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      worst = Math.max(worst, Math.abs(s.drawA.reduce((a, q) => a + q, 0) - s.drawB.reduce((a, q) => a + q, 0)), Math.abs(s.cardInA - s.cardInB));
    }
    stat('worst progress gap A-B ' + ratio, Math.round(worst * 1000) / 1000, 'max');
    if (worst > 1e-6) out.push(tag + ': the sides are not at the same progress (' + worst + ')');
    return out;`, {}, {withHidden: true});
  report(ID, 'equal sides', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Nothing teleports (rendered, 60 fps): the document's centre, each card's centre and each paragraph's centre move by
// less than 90 px per frame; each card and each paragraph first appears at the open document's centre.
test(`${ID}: the document and the pieces that come out of it move continuously, and the pieces start at the document`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const c = e => { const b = box(e); return {x: (b.l + b.r) / 2, y: (b.t + b.b) / 2, v: eff(svg, e)}; };
    const doc = node(svg, 'rm-doc');
    const pieces = [node(svg, 'rm-card-a-body'), node(svg, 'rm-card-b-body'), ...nodes(svg, /^rm-exhibit\\d+$/)];
    let prev = null, worst = 0, firstOff = 0;
    const seen = pieces.map(() => false);
    let docC = null;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const now = [doc, ...pieces].map(c);
      if (now[0].v > 0.05) docC = now[0];
      if (prev) now.forEach((q, i) => { if (q.v > 0.05 && prev[i].v > 0.05) worst = Math.max(worst, Math.hypot(q.x - prev[i].x, q.y - prev[i].y)); });
      pieces.forEach((e, i) => { const q = now[i + 1]; if (!seen[i] && q.v > 0.05) { seen[i] = true; if (docC) firstOff = Math.max(firstOff, Math.hypot(q.x - docC.x, q.y - docC.y)); } });
      prev = now;
    }
    const k = svg.getScreenCTM().a;
    stat('max move px/frame ' + ratio, Math.round(worst / k), 'max');
    stat('max first-appearance offset from the document px ' + ratio, Math.round(firstOff / k), 'max');
    if (worst / k > 90) out.push(tag + ': a piece jumps ' + Math.round(worst / k) + ' px in one frame');
    if (firstOff / k > 40) out.push(tag + ': a piece first appears ' + Math.round(firstOff / k) + ' px from the document');
    return out;`, {}, {withHidden: true});
  report(ID, 'continuity of the pieces', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The action is recognisable with the labels hidden: the hand reaches the document, the document rises, both cards and
// every paragraph come out, every line runs with its marker; nothing written in the room.
test(`${ID}: labels hidden — the document rises and separates, every line runs with its marker; no text`, async ({page}) => {
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
    x.seek(0.22 * x.durationMs); const h1 = x.getState({bounds: false}).semantic;
    x.seek(0.4 * x.durationMs); const h2 = x.getState({bounds: false}).semantic;
    x.seek(x.durationMs);
    const lines = [...svg.querySelectorAll('[data-node^="rm-link-"]')].filter(e => /^rm-link-[ab]\d+$/.test(e.getAttribute('data-node')));
    const marks = [...svg.querySelectorAll('[data-node^="rm-link-"]')].filter(e => /-m$/.test(e.getAttribute('data-node')));
    return {raised: Math.hypot(h1.hand.x - h0.hand.x, h1.hand.y - h0.hand.y), docMoved: Math.hypot(h2.doc.x - h0.doc.x, h2.doc.y - h0.doc.y), cards: ['a', 'b'].map(s => op(svg.querySelector(`[data-node="rm-card-${s}"]`))), lines: lines.map(op), marks: marks.map(op), text: [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length};
  }, ID);
  expect(out.raised).toBeGreaterThan(10);
  expect(out.docMoved).toBeGreaterThan(40);
  expect(Math.min(...out.cards)).toBeGreaterThan(0.95);
  expect(out.lines.length).toBe(4);
  expect(Math.min(...out.lines)).toBeGreaterThan(0.95);
  expect(Math.min(...out.marks)).toBeGreaterThan(0.95);
  expect(out.text).toBe(0);
});
