// LAW-0310 — Pausa de audiencia · mechanism. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): every connector ends on its element (edge to edge, rendered), the order does not change when
// seeking (seek identity forward / fresh / backward), and a relation is never drawn as causation by default.
// Timing (u): pieces lift 0.02–0.13 · element labels 0.12–0.17 · relationships 0.18–0.39 · tracer 0.41–0.63 (once the
// panel is reached, 0.498, the session clock — running from u = 0 — slows down 0.528–0.624 and stops; pause badge
// 0.624–0.653; the recess card 0.679–0.749; the connector 0.753–0.783; its caption 0.783–0.812; floor rings 0.816–0.853)
// · the same neutral frame round both places 0.87–0.92; still from 0.92 (the lifted wall clock keeps running).
// Legal: ● session active / ◆ recess are supplied states of equal weight; times fictional and labelled as supplied; no
// rule on recesses, duration, time limit, consequence or end of the proceedings; jurisdiction unspecified.
// People floors (coordinator; hearings measure the FIGURE height): >= 60 px off 1:1; >= 55 px at 1:1 except
// long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, pauseConsistencyTest, glyphStateTest, noTwinTextTest, positionsKeptTest, glyphFollowsStateTest, ES_WORDS, FLOOR_FOR} from './pausa-audiencia-checks.js';


const ID = 'LAW-0310';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.lifted === 0 && s.clockState === 'running' && s.pause === 0 && s.card === 0", label: 'rest: the pieces in their places; the session clock runs; no card'},
    {at: 0.16, fn: "s.lifted === 1 && s.drawn.every(d => d === 0) && s.clockState === 'running'", label: 'separate: the pieces are lifted before any relationship is drawn'},
    {at: 0.3, fn: 's.drawn.some(d => d > 0) && s.drawn.some(d => d < 1)', label: 'relate: the relationships are drawn one after the other'},
    {at: 0.4, fn: "s.drawn.every(d => d === 1) && s.tracer === null && s.clockState === 'running'", label: 'every relationship drawn before the tracer; the clock still runs'},
    {at: 0.45, fn: 's.tracer !== null', label: 'trace: the tracer runs along the relationships'},
    {at: 0.6, fn: "s.clockState === 'slowing' && s.pause === 0", label: 'once the tracer has reached the panel the session clock slows down'},
    {at: 0.665, fn: "s.clockState === 'stopped' && s.run === 1 && s.pause === 1 && s.card === 0", label: 'the session clock has stopped with its pause badge before the card comes'},
    {at: 0.72, fn: "s.cardState === 'coming' && s.link === 0 && s.caption === 0 && s.frames === 0", label: 'the recess card comes out; no connector yet; nothing framed'},
    {at: 0.77, fn: "s.cardState === 'connecting' && s.card === 1", label: 'the connector draws from the clock to the card once the card has arrived'},
    {at: 0.86, fn: "s.cardState === 'connected' && s.caption === 1 && s.pins === 1 && s.frames === 0", label: 'the connected card, its caption and the kept positions stand before both places are framed'},
    {at: 1, fn: "s.clockState === 'stopped' && s.cardState === 'connected' && s.frames === 1 && s.problems.length === 0 && s.allReached && s.kinds.join(',') === 'relation,communication' && !s.kinds.includes('causal')", label: 'hold: origin, paused clock, connected recess card and kept positions visible, the same frame round both places; only the supplied kinds; no causal link by default; the composition fits'},
    {at: 0.1, fn: "s.clockState === 'running' && s.tracer === null && s.card === 0 && s.pins === 0", label: 'seeking back restores the running clock'},
    {at: 0.45, params: {textVisibility: 'none'}, fn: 's.tracer !== null && s.drawn.every(d => d === 1)', label: 'labels hidden: the same relationships and tracer'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focus === 'clock' && s.trav === 'clock>board>participants' && s.problems.length === 0 && s.cardState === 'connected'", label: 'another supplied mechanism: a link from the wall clock, other traversal and focus'},
    {at: 1, params: {relationships: [{from: 'exhibit', to: 'board', kind: 'causal'}, {from: 'board', to: 'participants', kind: 'communication'}], traversalOrder: ['exhibit', 'board']}, fn: "s.kinds.includes('causal')", label: 'a causal link is drawn only when the author supplies it'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const kinds = new Set(p.relationships.map(r => r.kind)); return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.states.active, p.states.recess, p.labels.positions, p.labels.sequence, p.labels.key, ...p.elements.filter(e => (e.id !== 'exhibit' || p.exhibits.length) && (e.id !== 'participants' || p.speakers.length > 1)).map(e => e.label), ...[...kinds].map(k => p.relationLabels[k])];",
  content: 'return [...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.elements.map(e => e.label)];',
  captions: "const kinds = new Set(p.relationships.map(r => r.kind)); return [p.labels.sequence, ...[...kinds].map(k => p.relationLabels[k])];",
});

ratioChecks(ID, 'order stable, states after their visit, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits (every caption placed beside its own line)'},
  {at: times(0.4, 0.9, 0.005), fn: "!(s.clockState === 'slowing' && (s.card > 0 || s.pause > 0))", label: 'one thing at a time: no badge or card while the clock slows'},
  {at: times(0.4, 0.9, 0.005), fn: 's.card === 0 || s.pause === 1', label: 'the card only comes out once the clock is paused'},
  {at: times(0.4, 0.9, 0.005), fn: 's.link === 0 || s.card === 1', label: 'the connector only draws once the card has arrived'},
  {at: times(0.4, 0.9, 0.005), fn: "s.clockState === 'running' || s.drawn.every(d => d === 1)", label: 'the clock only slows once every relationship is drawn'},
  {at: [0.2, 0.5, 1], fn: "s.order === (() => { const o = []; for (const q of P.sequence) if (q < P.statements.length && !o.includes(q)) o.push(q); for (let i = 0; i < P.statements.length; i++) if (!o.includes(i)) o.push(i); return o.join('>'); })()", label: 'the place order is the supplied sequence at every seek'},
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
      : id === 'participants' ? union([...nodes(svg, /^rm-p\\d$/).filter(e => 'rm-p' + sem0.operatorIndex !== e.getAttribute('data-node')), node(svg, 'rm-table')])
      : id === 'operator' ? union([node(svg, 'rm-p' + sem0.operatorIndex), node(svg, 'rm-lectern')]) : id === 'board' ? box(node(svg, 'rm-board-body')) : id === 'clock' ? box(node(svg, 'rm-lift-clock')) : box(node(svg, 'rm-lift-cab'));
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
    const els = {operator: union([node(svg, 'rm-p' + sem0.operatorIndex), node(svg, 'rm-lectern')]), board: box(node(svg, 'rm-board-body')), clock: node(svg, 'rm-lift-clock') ? box(node(svg, 'rm-lift-clock')) : null, exhibit: node(svg, 'rm-lift-cab') ? box(node(svg, 'rm-lift-cab')) : null, participants: node(svg, 'rm-table') ? union([...nodes(svg, /^rm-p\\d$/).filter(e => 'rm-p' + sem0.operatorIndex !== e.getAttribute('data-node')), node(svg, 'rm-table')]) : null};
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
noOverlapTest(ID, {markers: ['[data-node^="el-"]', '[data-node^="rel"]', '[data-node="tracer"]', '[data-node^="rm-lift-clock"]', '[data-node^="rm-lift-cab"]', '[data-node="rm-sclock"]', '[data-node="b0"], [data-node="b1"], [data-node="b2"], [data-node="b3"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node^="rm-lift-clock"]', '[data-node^="rm-lift-cab"]', '[data-node^="conn"]', '[data-node="tracer"]']});
armsClearTest(ID, {props: ['[data-node="rm-board-body"]', '[data-node="rm-cap"]', '[data-node="rm-tag"]', '[data-node="rm-sclock"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]']});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-recess"] path:first-of-type', '[data-node="lg-active"] circle'], ['[data-node="rm-capplate-g"]', '[data-node="rm-tagplate-g2"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
pauseConsistencyTest(ID);
glyphStateTest(ID, {at: [1]});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.58, 0.7, 0.75, 0.81, 0.95, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="conn"][data-node$="-line"]']});
textLinesVisibleTest(ID);
// (the lifted wall clock keeps running while the session clock is paused)
positionsKeptTest(ID, {pausedFrom: 0.63});
glyphFollowsStateTest(ID);
