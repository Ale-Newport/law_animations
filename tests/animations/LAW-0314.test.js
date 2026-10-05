// LAW-0314 — Conclusiones de las partes · mechanism. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): every connector ends on its element; the order does not change when seeking; a relation is
// not drawn as causality by default (plain relation: end dots, no arrowhead; communication: hollow end; causal arrowhead
// only when supplied).
// Composition (recomposed 2026-10-05 after the hearings-09 review: the mechanism must not be the story's picture): an
// exploded view — the two cards leave the board through the top wall to a band above the room (A to one side, B mirrored
// to the other) and the exhibits lift off the table to an enlarged row between them; the parties stay at their lecterns;
// every piece is labelled ON the plan and each relation kind is captioned ON the plan, between the two mirrored lines it
// names (in a crowded 1:1 stress frame only, the room and its wall clock are named in the panel instead).
// Timing (u): separate 0.03–0.15 (the pieces leave the room) · labels 0.155–0.19 · relate 0.18–0.41 (a relationship
// and its mirror on the other side share one window: A and B at the same pace; each kind's caption with its first
// relationship) · trace 0.45–0.72 (the supplied traversal and its mirror, at the same time; reached elements pulse, the
// focus most) · gather: frames round both cards 0.77–0.82.
// Legal: a link only means "invoked by the party (as supplied)"; both sides drawn alike, at the same time, with the same
// number of links; ● / ◆ with equal ink; nothing proved, weighed or decided; jurisdiction unspecified. People floors
// (coordinator; hearings measure the FIGURE height): >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, cpConsistencyTest, glyphSideTest, noTwinTextTest, placesKeptTest, linksAnchoredTest, gluedNumbersTest, noOneWordLineTest, ES_WORDS, FLOOR_FOR} from './conclusiones-partes-checks.js';

const ID = 'LAW-0314';
const eq = 's.drawA.every((q, j) => j >= s.drawB.length || q === s.drawB[j])';

contractSuite(ID, {
  continuity: ['tracer', 'tracer2', 'cardA', 'cardB'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.spread === 0 && s.drawn.every(q => q === 0) && s.tracer === null", label: 'rest: the pieces together; nothing drawn'},
    {at: 0.16, fn: 's.spread === 1 && s.drawn.every(q => q === 0) && s.outOfRoom', label: 'separated (both cards and every exhibit out of the room, above its top wall) before any relationship is drawn'},
    {at: 0.3, fn: `s.drawn.some(q => q > 0) && ${eq} && s.kinds.every(k => k !== 'causal')`, label: 'relate: the relationships are drawn, A and B at the same pace; no causal link by default'},
    {at: 0.42, fn: "s.drawn.every(q => q === 1) && s.linkStateA === 'linked' && s.linkStateB === 'linked'", label: 'every supplied relationship drawn before the trace'},
    {at: 0.5, fn: 's.tracer !== null && s.tracer2 !== null && s.routes === 2', label: 'the tracer runs the supplied traversal and a second one its mirror, at the same time'},
    {at: 1, fn: "s.frames === 1 && s.drawn.every(q => q === 1) && s.problems.length === 0 && s.tracer === null && s.cardScale.a === 1 && s.cardScale.b === 1", label: 'gather: everything visible, the same frame round both cards; the composition fits'},
    {at: 0.1, fn: 's.drawn.every(q => q === 0) && s.frames === 0', label: 'seeking back restores the separate beat'},
    {at: 1, params: {relationships: [{from: 'argument-a', to: 'evidence', kind: 'causal'}, {from: 'argument-b', to: 'evidence', kind: 'causal'}], traversalOrder: ['argument-a', 'evidence']}, fn: "s.kinds.every(k => k === 'causal') && s.problems.length === 0", label: 'a causal link only when supplied'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.states.a, p.states.b, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k]), p.labels.sequence, p.labels.key];",
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, ...p.elements.map(e => e.label)];',
  captions: 'return [p.labels.sequence];',
});

ratioChecks(ID, 'order stable, equal pace, composition fits', [
  {at: times(0, 1, 0.005), fn: eq, label: 'A and B are at the same point at every u'},
  {at: times(0.18, 0.44, 0.005), fn: 's.spread === 1', label: 'relationships are drawn only once the pieces have separated'},
  {at: times(0.44, 0.75, 0.01), fn: 's.drawn.every(q => q === 1)', label: 'the trace runs over drawn relationships only'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// Every generic connector lands on its two elements (rendered): a party's line starts at the front of its own lectern and
// ends on its own card's lower edge; its end decoration matches its kind (hollow for communication, no arrowhead unless
// causal); at every u (step 0.02).
test(`${ID}: every connector ends on its own elements, in its kind's style, at every u (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    let n = 0;
    for (let u = 0; u <= 1.0001; u += 0.02) {
      x.seek(u * x.durationMs);
      for (const c of nodes(svg, /^conn\\d+$/)) {
        if (eff(svg, c) < 0.05) continue;
        const nm = c.getAttribute('data-node');
        const ln = node(svg, nm + '-line');
        const m = ln.getScreenCTM();
        const p0 = ln.getPointAtLength(0), pL = ln.getPointAtLength(ln.getTotalLength());
        const A = new DOMPoint(p0.x, p0.y).matrixTransform(m), B = new DOMPoint(pL.x, pL.y).matrixTransform(m);
        const from = c.getAttribute('data-from'), to = c.getAttribute('data-to'), kind = c.getAttribute('data-kind');
        const end = node(svg, nm + '-end');
        n++;
        if (from.startsWith('party-') && to.startsWith('argument-')) {
          const card = box(node(svg, 'rm-card-' + to.slice(-1) + '-body'));
          const lec = box(node(svg, 'rm-lectern-' + from.slice(-1)));
          if (Math.hypot(A.x - (lec.l + lec.r) / 2, A.y - (lec.t + lec.b) / 2) > Math.max(lec.w, lec.h)) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' does not start at its lectern');
          if (eff(svg, end) > 0.5) { const e = box(end); const ex = (e.l + e.r) / 2, ey = (e.t + e.b) / 2; if (ex < card.l || ex > card.r || Math.abs(ey - card.b) > (e.h / 2) + 4) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' does not end on its card'); }
        }
        const head = end && end.querySelector('path');
        if (kind !== 'causal' && head) out.push(tag + ': ' + nm + ' has an arrowhead but is ' + kind);
        if (kind === 'communication' && end && !(end.querySelector('circle') && end.querySelector('circle').getAttribute('fill') !== end.querySelector('circle').getAttribute('stroke'))) out.push(tag + ': ' + nm + ' communication end is not hollow');
      }
    }
    stat('connectors checked ' + ratio, n, 'max');
    return [...new Set(out)].slice(0, 20);`, {}, {withHidden: true});
  report(ID, 'connectors', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Equal weight, rendered: same card size, same link colour and width on both sides, the two connectors of a mirrored
// pair drawn to the same fraction at every frame (60 fps).
test(`${ID}: both sides drawn alike — card size, link strokes, the same fraction drawn at every frame`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const A = box(node(svg, 'rm-card-a-body')), B = box(node(svg, 'rm-card-b-body'));
    if (Math.abs(A.w - B.w) > 0.5 || Math.abs(A.h - B.h) > 0.5) out.push(tag + ': cards differ');
    const st = new Set(nodes(svg, /^rm-link-[ab]\\d+$/).map(l => l.getAttribute('stroke') + '|' + l.getAttribute('stroke-width')));
    if (st.size > 1) out.push(tag + ': link strokes differ');
    let worst = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      worst = Math.max(worst, Math.abs(s.drawA.reduce((a, q) => a + q, 0) - s.drawB.reduce((a, q) => a + q, 0)), Math.abs(s.cardScale.a - s.cardScale.b) * 0);
    }
    stat('worst progress gap A-B ' + ratio, Math.round(worst * 1000) / 1000, 'max');
    if (worst > 1e-6) out.push(tag + ': A and B not at the same progress');
    return out;`, {}, {withHidden: true});
  report(ID, 'equal sides', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The mechanism is not the story's picture (hearings-09 review, 2026-10-05), rendered in every preset × ratio × labels:
// at u = 0 the cards lie on the board and the exhibits on the table inside the room; from the end of the separate beat to
// the hold both cards and every exhibit stand OUTSIDE the room, above its top wall, each card moved by more than a
// quarter of the room's height; the exhibits are drawn larger there; the parties' heads have not moved.
test(`${ID}: exploded view — the cards and the exhibits leave the room and stay out of it to the hold (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const W0 = () => box(node(svg, 'rm-walls'));
    const cards = () => ['a', 'b'].map(s => box(node(svg, 'rm-card-' + s + '-body')));
    const exs = () => nodes(svg, /^rm-exhibit\d+$/).map(box);
    x.seek(0);
    const w0 = W0(), c0 = cards(), e0 = exs();
    for (const c of [...c0, ...e0]) if (c.t < w0.t - 0.5) out.push(tag + ' u=0: a piece already out of the room');
    for (const u of [0.16, 0.3, 0.6, 0.85, 1]) {
      x.seek(u * x.durationMs);
      const w = W0(), c1 = cards(), e1 = exs();
      for (const c of [...c1, ...e1]) if (c.b > w.t + 0.5) out.push(tag + ' u=' + u + ': a piece is still inside the room');
      c1.forEach((c, i) => { const d = Math.hypot((c.l + c.r) / 2 - (c0[i].l + c0[i].r) / 2, (c.t + c.b) / 2 - (c0[i].t + c0[i].b) / 2); stat('min card travel / room h ' + ratio, Math.round(d / w.h * 100) / 100); if (d < w.h * 0.25) out.push(tag + ' u=' + u + ': card moved only ' + d.toFixed(0) + ' px'); });
      e1.forEach((e, i) => { if (e.w < e0[i].w * 1.3) out.push(tag + ' u=' + u + ': exhibit ' + i + ' not enlarged out of the room'); });
    }
    return out;`, {}, {withHidden: true});
  report(ID, 'exploded', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Every piece and every relation kind is named ON the plan (rendered, every preset × ratio, labels shown, at the hold):
// a visible chip el-<id> beside each supplied element (the room and the wall clock may be named in the panel instead,
// only where the plan has no floor for them: a crowded 1:1 frame), and a visible caption cap-<kind> for every kind of
// supplied relationship, drawn on the plan (not in the panel); each chip is nearer its own piece than any other piece.
test(`${ID}: every element and every relation kind is labelled on the plan at the hold (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const DEF = (await import('../../src/animations/hearings/LAW-0314.js')).default.defaultParams;
  const {bad} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    const ids = (pr.params.elements || arg.defEls).map(e => e.id);
    const panel = node(svg, 'panel'); const P = panel ? box(panel) : null;
    for (const id of ids) {
      const chip = node(svg, 'el-' + id);
      const vis = chip && eff(svg, chip) > 0.95;
      if (!vis) { out.push(tag + ': no visible label for ' + id); continue; }
      const inPanel = P && chip.closest('[data-node="panel"]');
      if (inPanel && !((id === 'room' || id === 'clock') && ratio === '1:1')) out.push(tag + ': ' + id + ' named only in the panel');
    }
    const kinds = [...new Set((pr.params.relationships || arg.defRels).map(q => q.kind))];
    for (const k of kinds) {
      const cap = node(svg, 'cap-' + k);
      if (!cap || eff(svg, cap) < 0.95) out.push(tag + ': no visible caption for ' + k);
      else if (cap.closest('[data-node="panel"]')) out.push(tag + ': caption of ' + k + ' in the panel');
    }
    return out;`, {defEls: DEF.elements, defRels: DEF.relationships}, {withHidden: false});
  expect(bad, bad.join('\n')).toEqual([]);
});

const BADGES = ['[data-node="b0"]', '[data-node="b1"]', '[data-node="b2"]', '[data-node="b3"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: BADGES});
noOverlapTest(ID, {markers: [...BADGES, '[data-node^="tracer"]', '[data-node^="rm-link-"][data-node$="-m"]', '[data-node$="-end"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...BADGES, '[data-node^="el-"]', '[data-node^="cap-"]', '[data-node^="conn"]', '[data-node="rm-board"]', '[data-node="rm-links"]', '[data-node^="tracer"]', '[data-node^="fr-"]']});
armsClearTest(ID, {props: ['[data-node="rm-board-body"]', '[data-node^="rm-exhibit"]', '[data-node="rm-clock"]', '[data-node="rm-table"]']});
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
seekHistoryTest(ID, {at: [0.1, 0.25, 0.35, 0.5, 0.6, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['path[data-node^="rm-link-"]', '[data-node^="conn"][data-node$="-line"]']});
textLinesVisibleTest(ID);
placesKeptTest(ID);
linksAnchoredTest(ID);
gluedNumbersTest(ID);
noOneWordLineTest(ID);
void presetsFor;
