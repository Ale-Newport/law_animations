// LAW-0298 — Objeción procesal · mechanism. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): every connector ends on its element (edge to edge, rendered), the order does not change when
// seeking (seek identity forward / fresh / backward), and a relation is never drawn as causation by default.
// Timing (u): pieces lift 0.02–0.13 · element labels 0.12–0.17 · relationships 0.18–0.39 · tracer 0.41–0.63 (once the
// witness box is reached, the question slip travels to the tray and slides up the guide; the signal rises 0.59–0.615 and
// the question pauses at 0.62) · the reason card travels 0.64–0.695 and opens · the response card travels 0.761–0.81
// and opens · the same neutral frame round both supplied cards 0.87–0.92; still from 0.92.
// Legal: ● intervention raised / ◆ response as supplied are supplied states of equal weight; the response card is only a
// supplied card; the question stays paused (no grounds, ruling, outcome, winner or hierarchy).
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {rulingFreeDataTest, rulingFreeRenderTest, stressLongerTest, objectionConsistencyTest, noHierarchyTest, ES_WORDS, FLOOR_FOR} from './objecion-procesal-checks.js';


const ID = 'LAW-0298';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.lifted === 0 && s.itemState[s.qI] === 'stack' && s.itemState[s.intI] === 'none' && s.itemState[s.resI] === 'none' && s.paused === 0 && s.signal === 0", label: 'rest: the pieces in their places; the question slip on the lectern; no card supplied, no signal'},
    {at: 0.16, fn: 's.lifted === 1 && s.drawn.every(d => d === 0)', label: 'separate: the pieces are lifted before any relationship is drawn'},
    {at: 0.3, fn: 's.drawn.some(d => d > 0) && s.drawn.some(d => d < 1)', label: 'relate: the relationships are drawn one after the other'},
    {at: 0.4, fn: "s.drawn.every(d => d === 1) && s.tracer === null && s.itemState[s.qI] === 'stack' && s.signal === 0", label: 'every relationship drawn before the tracer; nothing has moved yet'},
    {at: 0.45, fn: 's.tracer !== null', label: 'trace: the tracer runs along the relationships'},
    {at: 0.6, fn: "s.itemState[s.qI] === 'carried' && s.signal > 0 && s.paused === 0", label: 'once the tracer has reached the witness box the question slip moves; the signal is rising'},
    {at: 0.63, fn: "s.paused === 1 && s.signal === 1 && s.itemState[s.intI] === 'none'", label: 'the signal is up and the question pauses (cause before effect); no card has moved yet'},
    {at: 0.67, fn: "s.itemState[s.intI] === 'travelling' && s.itemState[s.resI] === 'none'", label: 'the reason card travels to the rail'},
    {at: 0.8, fn: "s.itemState[s.intI] === 'open' && s.itemState[s.resI] === 'travelling' && s.frames === 0", label: 'the reason card is open; the response card travels; nothing framed yet'},
    {at: 0.86, fn: "s.itemState[s.intI] === 'open' && s.itemState[s.resI] === 'open' && s.frames === 0", label: 'both supplied cards reach the rail before they are framed'},
    {at: 1, fn: "s.itemState[s.qI] === 'paused' && s.open[s.qI] === 0 && s.itemState[s.intI] === 'open' && s.itemState[s.resI] === 'open' && s.frames === 1 && s.problems.length === 0 && s.routesClear && s.allReached && s.kinds.join(',') === 'communication,sequence,relation' && !s.kinds.includes('causal')", label: 'hold: the question still paused; both supplied cards on the rail with the same frame; only the supplied kinds; no causal link by default; the composition fits'},
    {at: 0.1, fn: "s.itemState[s.qI] === 'stack' && s.tracer === null && s.paused === 0", label: 'seeking back restores the rest state'},
    {at: 0.45, params: {textVisibility: 'none'}, fn: 's.tracer !== null && s.drawn.every(d => d === 1)', label: 'labels hidden: the same relationships and tracer'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focus === 'rail' && s.trav === 'exhibit>rail>witnessBox>questioner' && s.problems.length === 0 && s.paused === 1 && s.itemState[s.intI] === 'open' && s.itemState[s.resI] === 'open'", label: 'another supplied mechanism: other order, traversal and focus'},
    {at: 1, params: {relationships: [{from: 'questioner', to: 'witnessBox', kind: 'causal'}, {from: 'witnessBox', to: 'rail', kind: 'sequence'}], traversalOrder: ['questioner', 'witnessBox']}, fn: "s.kinds.includes('causal')", label: 'a causal link is drawn only when the author supplies it'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const kinds = new Set(p.relationships.map(r => r.kind)); const st = p.statements; return [p.hearing.room, ...p.speakers.map(s => s.label), ...st.map(s => s.text), ...p.exhibits, ...(st.some(s => s.kind === 'intervention') ? [p.states.intervention, p.labels.signal] : []), ...(st.some(s => s.kind === 'response') ? [p.states.response] : []), ...(st.some(s => s.kind === 'question') ? [p.labels.paused] : []), p.labels.sequence, p.labels.key, ...p.elements.filter(e => (e.id !== 'exhibit' || p.exhibits.length) && (e.id !== 'participants' || p.speakers.length > 2)).map(e => e.label), ...[...kinds].map(k => p.relationLabels[k])];",
  content: 'return [...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.elements.map(e => e.label)];',
  captions: "const kinds = new Set(p.relationships.map(r => r.kind)); return [p.labels.sequence, ...[...kinds].map(k => p.relationLabels[k])];",
});

ratioChecks(ID, 'order stable, states after their visit, composition fits', [
  {at: [1], fn: 's.problems.length === 0 && s.routesClear', label: 'the composition fits (every caption placed beside its own line; every card route clear)'},
  {at: times(0.4, 0.86, 0.005), fn: "s.itemState.filter(c => c === 'carried' || c === 'sliding' || c === 'travelling' || c === 'unfolding').length <= 1", label: 'one card moving at a time'},
  {at: times(0.4, 0.9, 0.005), fn: "s.itemState[s.intI] === 'none' || s.paused === 1", label: 'the reason card only moves once the question is paused'},
  {at: times(0.4, 0.9, 0.005), fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: 'a card text never shows before its card is open'},
  {at: [0.2, 0.5, 1], fn: "s.order === (() => { const o = []; for (const q of P.sequence) if (q < P.statements.length && !o.includes(q)) o.push(q); for (let i = 0; i < P.statements.length; i++) if (!o.includes(i)) o.push(i); return o.join('>'); })()", label: 'the card order is the supplied sequence at every seek'},
]);

// Connectors end on their elements; captions sit beside their own line (>= 20 px nearer it than any other line, never
// crossed by a line); the tracer stays on a connector.
test(`${ID}: connectors land on their elements; captions beside their own line; the tracer on the lines (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const k = px1080(svg, w, h);
    const union = els => { const bs = els.filter(Boolean).map(box).filter(b => b.w > 0); return bs.length ? {l: Math.min(...bs.map(b => b.l)), t: Math.min(...bs.map(b => b.t)), r: Math.max(...bs.map(b => b.r)), b: Math.max(...bs.map(b => b.b))} : null; };
    const sem0 = x.getState({bounds: false}).semantic;
    const elBox = id => id === 'room' ? box(node(svg, 'rm-walls'))
      : id === 'participants' ? union([...nodes(svg, /^rm-p\\d$/).filter(e => !['rm-p' + sem0.questionerIndex, 'rm-p' + sem0.witnessIndex].includes(e.getAttribute('data-node'))), node(svg, 'rm-table')])
      : id === 'questioner' ? union([node(svg, 'rm-p' + sem0.questionerIndex), node(svg, 'rm-lectern')]) : id === 'witnessBox' ? box(node(svg, 'rm-wbox')) : id === 'rail' ? box(node(svg, 'rm-rail')) : id === 'clock' ? box(node(svg, 'rm-lift-clock')) : box(node(svg, 'rm-lift-cab'));
    const near = (q, b, pad) => q.x >= b.l - pad && q.x <= b.r + pad && q.y >= b.t - pad && q.y <= b.b + pad;
    const lines = [];
    for (const c of nodes(svg, /^conn\\d$/)) {
      const ln = node(svg, c.getAttribute('data-node') + '-line');
      const m = ln.getScreenCTM();
      const L = ln.getTotalLength();
      const P2 = t => new DOMPoint(ln.getPointAtLength(t).x, ln.getPointAtLength(t).y).matrixTransform(m);
      const pts = []; for (let t = 0; t <= L; t += 2) pts.push(P2(t)); pts.push(P2(L));
      lines.push({i: c.getAttribute('data-node').slice(4), pts});
      const A = P2(0), B = P2(L);
      if (!near(A, elBox(c.getAttribute('data-from')), 4)) out.push(tag + ': ' + c.getAttribute('data-node') + ' does not start on ' + c.getAttribute('data-from'));
      if (!near(B, elBox(c.getAttribute('data-to')), 4)) out.push(tag + ': ' + c.getAttribute('data-node') + ' does not end on ' + c.getAttribute('data-to'));
    }
    const dist = (b, q) => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b));
    for (const lab of nodes(svg, /^rel\\d$/)) {
      if (eff(svg, lab) < 0.5) continue;
      const i = lab.getAttribute('data-node').slice(3);
      const b = box(node(svg, 'rel' + i + '-body'));
      const own = lines.find(l => l.i === i);
      const dOwn = Math.min(...own.pts.map(q => dist(b, q)));
      const dOther = Math.min(1e9, ...lines.filter(l => l !== own).flatMap(l => l.pts.map(q => dist(b, q))));
      stat('caption margin px (other - own) ' + ratio, Math.round((dOther - dOwn) / k));
      stat('caption gap to own line px ' + ratio, Math.round(dOwn / k), 'max');
      if ((dOther - dOwn) / k < 20) out.push(tag + ': caption rel' + i + ' only ' + Math.round((dOther - dOwn) / k) + ' px nearer its own line');
      if (dOwn / k > 75) out.push(tag + ': caption rel' + i + ' is ' + Math.round(dOwn / k) + ' px from its own line');
      if (lines.some(l => l.pts.some(q => q.x > b.l + 1 && q.x < b.r - 1 && q.y > b.t + 1 && q.y < b.b - 1))) out.push(tag + ': a line runs under caption rel' + i);
    }
    for (let u = 0.41; u <= 0.635; u += 0.01) {
      x.seek(u * x.durationMs);
      const tr = node(svg, 'tracer');
      if (eff(svg, tr) < 0.5) continue;
      const tb = box(tr); const c = {x: (tb.l + tb.r) / 2, y: (tb.t + tb.b) / 2};
      const d = Math.min(...lines.flatMap(l => l.pts.map(q => Math.hypot(q.x - c.x, q.y - c.y))));
      if (d / k > 6) out.push(tag + ' u=' + u.toFixed(2) + ': tracer ' + Math.round(d / k) + ' px off the lines');
    }
    return out;`, {}, {withHidden: true});
  report(ID, 'connectors', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Element labels are nearest their own element (rendered, at the hold): each label's edge gap to its own element is
// >= 10 px smaller than to any other element (the room excepted: it contains the others).
test(`${ID}: each element label is nearest its own element (>= 10 px margin, rendered)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const k = px1080(svg, w, h);
    const union = els => { const bs = els.filter(Boolean).map(box).filter(b => b.w > 0); return bs.length ? {l: Math.min(...bs.map(b => b.l)), t: Math.min(...bs.map(b => b.t)), r: Math.max(...bs.map(b => b.r)), b: Math.max(...bs.map(b => b.b))} : null; };
    const sem0 = x.getState({bounds: false}).semantic;
    const els = {questioner: union([node(svg, 'rm-p' + sem0.questionerIndex), node(svg, 'rm-lectern')]), witnessBox: box(node(svg, 'rm-wbox')), rail: box(node(svg, 'rm-rail')), clock: node(svg, 'rm-lift-clock') ? box(node(svg, 'rm-lift-clock')) : null, exhibit: node(svg, 'rm-lift-cab') ? box(node(svg, 'rm-lift-cab')) : null, participants: node(svg, 'rm-table') ? union([...nodes(svg, /^rm-p\\d$/).filter(e => !['rm-p' + sem0.questionerIndex, 'rm-p' + sem0.witnessIndex].includes(e.getAttribute('data-node'))), node(svg, 'rm-table')]) : null};
    const gap = (a, c) => Math.hypot(Math.max(a.l - c.r, 0, c.l - a.r), Math.max(a.t - c.b, 0, c.t - a.b));
    for (const id of Object.keys(els)) {
      const lb = node(svg, 'el-' + id + '-body'); if (!lb || !els[id]) continue;
      const b = box(lb), own = gap(b, els[id]);
      for (const [id2, e2] of Object.entries(els)) {
        if (id2 === id || !e2) continue;
        const m = (gap(b, e2) - own) / k;
        stat('label margin px ' + ratio, Math.round(m));
        if (m < 10) out.push(pr.name + ' ' + ratio + ': label of ' + id + ' only ' + Math.round(m) + ' px nearer it than ' + id2);
      }
    }
    return out;`, {});
  report(ID, 'element label ownership', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

const CHIPS = ['[data-node^="el-"][data-node$="-body"]', '[data-node^="rel"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node^="el-"]', '[data-node^="rel"]', '[data-node^="rm-lift-"]']});
noOverlapTest(ID, {markers: ['[data-node^="el-"]', '[data-node^="rel"]', '[data-node="tracer"]', '[data-node^="rm-lift-clock"]', '[data-node^="rm-lift-cab"]', '[data-node^="rm-slipwrap"]', '[data-node="rm-signal"]', '[data-node="rm-pause"]', '[data-node="b0"], [data-node="b1"], [data-node="b2"], [data-node="b3"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node^="rm-lift-clock"]', '[data-node^="rm-lift-cab"]', '[data-node^="conn"]', '[data-node^="rm-slipwrap"]', '[data-node="tracer"]', '[data-node="rm-pause"]']});
armsClearTest(ID, {props: ['[data-node^="rm-card"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]']});
// (legend ● / ◆ and the two frames here; the two cards' ● / ◆ in noHierarchyTest)
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-response"] path:first-of-type', '[data-node="lg-intervention"] circle'], ['[data-node="fr-res"]', '[data-node="fr-int"]']]});
neutralityTest(ID);
rulingFreeDataTest(ID);
rulingFreeRenderTest(ID);
stressLongerTest(ID);
objectionConsistencyTest(ID);
noHierarchyTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.62, 0.67, 0.8, 0.95, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="conn"][data-node$="-line"]']});
textLinesVisibleTest(ID);
