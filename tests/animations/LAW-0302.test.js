// LAW-0302 — Exhibición de documento · mechanism. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): every connector ends on its element (edge to edge, rendered), the order does not change when
// seeking (seek identity forward / fresh / backward), and a relation is never drawn as causation by default.
// Timing (u): pieces lift 0.02–0.13 · element labels 0.12–0.17 · relationships 0.18–0.39 · tracer 0.41–0.63 (once the
// board is reached, the document leaves its lifted exhibit 0.53 and settles on the board 0.645; its tag 0.645–0.675; the
// region frame 0.68–0.72; the enlarged zone 0.73–0.82; its caption 0.82–0.855) · the same neutral frame round both
// places 0.87–0.92; still from 0.92.
// Legal: ● complete document / ◆ selected detail are supplied states of equal weight; the content is generic (lines and
// blocks); the region is only a supplied region (no authenticity, admissibility, weight or ruling).
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45 px).
// coordinator decision (AUTHORING item 20): long-labels-stress is capped with its true driver and rendered before/after
// numbers recorded in the presets file (`coordinatorDecision`); the pre-cap preset is kept in production/scratch/hearings-06/.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, stressLongerTest, documentConsistencyTest, glyphStateTest, noTwinTextTest, ES_WORDS, FLOOR_FOR} from './exhibicion-documento-checks.js';


const ID = 'LAW-0302';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.lifted === 0 && s.docState === 'cabinet' && s.tag === 0 && s.zoom === 0", label: 'rest: the pieces in their places; the document lies on its exhibit; the board is empty'},
    {at: 0.16, fn: 's.lifted === 1 && s.drawn.every(d => d === 0) && s.docState === "cabinet"', label: 'separate: the pieces are lifted (the document with its exhibit) before any relationship is drawn'},
    {at: 0.3, fn: 's.drawn.some(d => d > 0) && s.drawn.some(d => d < 1)', label: 'relate: the relationships are drawn one after the other'},
    {at: 0.4, fn: "s.drawn.every(d => d === 1) && s.tracer === null && s.docState === 'cabinet'", label: 'every relationship drawn before the tracer; nothing has moved yet'},
    {at: 0.45, fn: 's.tracer !== null', label: 'trace: the tracer runs along the relationships'},
    {at: 0.58, fn: "s.docState === 'travelling' && s.tag === 0", label: 'once the tracer has reached the board the document travels down onto it'},
    {at: 0.7, fn: "s.docState === 'placed' && s.tag === 1 && s.frame > 0 && s.zoom === 0", label: 'the page has settled with its reference; the region is framed before anything is enlarged'},
    {at: 0.78, fn: "s.zoneState === 'enlarging' && s.caption === 0 && s.frames === 0", label: 'the enlarged copy grows into the zone; nothing framed yet'},
    {at: 0.86, fn: "s.zoneState === 'enlarged' && s.caption === 1 && s.frames === 0", label: 'the enlarged zone and its caption stand before both places are framed'},
    {at: 1, fn: "s.docState === 'placed' && s.zoneState === 'enlarged' && s.frames === 1 && s.problems.length === 0 && s.allReached && s.kinds.join(',') === 'relation,communication' && !s.kinds.includes('causal')", label: 'hold: origin, page, enlarged zone and state visible, the same frame round both places; only the supplied kinds; no causal link by default; the composition fits'},
    {at: 0.1, fn: "s.docState === 'cabinet' && s.tracer === null && s.zoom === 0", label: 'seeking back restores the rest state'},
    {at: 0.45, params: {textVisibility: 'none'}, fn: 's.tracer !== null && s.drawn.every(d => d === 1)', label: 'labels hidden: the same relationships and tracer'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focus === 'exhibit' && s.trav === 'participants>board>exhibit' && s.problems.length === 0 && s.zoneState === 'enlarged'", label: 'another supplied mechanism: other order, traversal and focus'},
    {at: 1, params: {relationships: [{from: 'exhibit', to: 'board', kind: 'causal'}, {from: 'board', to: 'participants', kind: 'communication'}], traversalOrder: ['exhibit', 'board']}, fn: "s.kinds.includes('causal')", label: 'a causal link is drawn only when the author supplies it'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const kinds = new Set(p.relationships.map(r => r.kind)); return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.states.document, p.states.detail, p.labels.frame, p.labels.sequence, p.labels.key, ...p.elements.filter(e => (e.id !== 'exhibit' || p.exhibits.length) && (e.id !== 'participants' || p.speakers.length > 1)).map(e => e.label), ...[...kinds].map(k => p.relationLabels[k])];",
  content: 'return [...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.elements.map(e => e.label)];',
  captions: "const kinds = new Set(p.relationships.map(r => r.kind)); return [p.labels.sequence, ...[...kinds].map(k => p.relationLabels[k])];",
});

ratioChecks(ID, 'order stable, states after their visit, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits (every caption placed beside its own line)'},
  {at: times(0.4, 0.9, 0.005), fn: "!(s.docState === 'travelling' && (s.frame > 0 || s.zoom > 0))", label: 'one thing at a time: nothing is framed or enlarged while the document travels'},
  {at: times(0.4, 0.9, 0.005), fn: 's.zoom === 0 || s.frame === 1', label: 'the zone only grows once its region is framed'},
  {at: times(0.4, 0.9, 0.005), fn: "s.docState === 'cabinet' || s.drawn.every(d => d === 1)", label: 'the document only moves once every relationship is drawn'},
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
      : id === 'participants' ? union([...nodes(svg, /^rm-p\\d$/).filter(e => 'rm-p' + sem0.presenterIndex !== e.getAttribute('data-node')), node(svg, 'rm-table')])
      : id === 'presenter' ? union([node(svg, 'rm-p' + sem0.presenterIndex), node(svg, 'rm-lectern')]) : id === 'board' ? box(node(svg, 'rm-board-body')) : id === 'clock' ? box(node(svg, 'rm-lift-clock')) : box(node(svg, 'rm-lift-cab'));
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
    const els = {presenter: union([node(svg, 'rm-p' + sem0.presenterIndex), node(svg, 'rm-lectern')]), board: box(node(svg, 'rm-board-body')), clock: node(svg, 'rm-lift-clock') ? box(node(svg, 'rm-lift-clock')) : null, exhibit: node(svg, 'rm-lift-cab') ? box(node(svg, 'rm-lift-cab')) : null, participants: node(svg, 'rm-table') ? union([...nodes(svg, /^rm-p\\d$/).filter(e => 'rm-p' + sem0.presenterIndex !== e.getAttribute('data-node')), node(svg, 'rm-table')]) : null};
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
noOverlapTest(ID, {markers: ['[data-node^="el-"]', '[data-node^="rel"]', '[data-node="tracer"]', '[data-node^="rm-lift-clock"]', '[data-node^="rm-lift-cab"]', '[data-node="rm-doc"]', '[data-node="b0"], [data-node="b1"], [data-node="b2"], [data-node="b3"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node^="rm-lift-clock"]', '[data-node^="rm-lift-cab"]', '[data-node^="conn"]', '[data-node="rm-doc"]', '[data-node="tracer"]']});
armsClearTest(ID, {props: ['[data-node="rm-board"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]']});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-detail"] path:first-of-type', '[data-node="lg-document"] circle'], ['[data-node="rm-capplate-g"]', '[data-node="rm-tagplate-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
stressLongerTest(ID);
documentConsistencyTest(ID);
glyphStateTest(ID, {at: [1]});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.58, 0.7, 0.8, 0.95, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="conn"][data-node$="-line"]']});
textLinesVisibleTest(ID);
