// LAW-0282 — Apertura de audiencia · mechanism. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): every connector ends on its element (edge to edge, rendered), the order does not change when
// seeking (seek identity forward / fresh / backward), and a relation is never drawn as causation by default (a plain
// relation has end dots and no arrowhead; communication and sequence are solid with their own end marks; an arrowhead
// only for a supplied causal link; shipped presets supply none).
// Timing (u): pieces lift 0.02–0.13 · element labels 0.12–0.17 · relationships drawn one after the other 0.18–0.42 ·
// tracer 0.44–0.74 along the supplied traversal (the reached element enlarges; its state changes as it is reached) ·
// gather (held) 0.75–1.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, limbsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';

const ID = 'LAW-0282';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.lifted === 0 && s.switchK === 0 && s.lights === 0 && s.cardState.every(c => c === 'in-tray')", label: 'rest: the pieces in their places, the room not yet activated'},
    {at: 0.16, fn: 's.lifted === 1 && s.drawn.every(d => d === 0)', label: 'separate: the pieces are lifted before any relationship is drawn'},
    {at: 0.3, fn: 's.drawn.some(d => d > 0) && s.drawn.some(d => d < 1)', label: 'relate: the relationships are drawn one after the other'},
    {at: 0.43, fn: 's.drawn.every(d => d === 1) && s.tracer === null && s.switchK === 0 && s.started === 0', label: 'every relationship drawn before the tracer; no state has changed yet'},
    {at: 0.6, fn: 's.tracer !== null', label: 'trace: the tracer runs along the relationships'},
    {at: 0.76, fn: "s.switchK === 1 && s.started === 1 && s.lights === 1 && s.cardState.every(c => c === 'placed')", label: 'the states changed as the tracer reached their elements'},
    {at: 1, fn: "s.problems.length === 0 && s.kinds.join(',') === 'relation,communication,sequence' && !s.kinds.includes('causal')", label: 'hold: only the supplied kinds; no causal link by default; the composition fits'},
    {at: 0.1, fn: 's.switchK === 0 && s.started === 0', label: 'seeking back restores the rest state'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.tracer !== null && s.drawn.every(d => d === 1)', label: 'labels hidden: the same relationships and tracer'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focus === 'room' && s.trav === 'tray>participants>unit>room' && s.problems.length === 0", label: 'another supplied mechanism: other links, traversal and focus'},
    {at: 1, params: {relationships: [{from: 'unit', to: 'room', kind: 'causal'}, {from: 'tray', to: 'participants', kind: 'sequence'}], traversalOrder: ['unit', 'room']}, fn: "s.kinds.includes('causal')", label: 'a causal link is drawn only when the author supplies it'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const kinds = new Set(p.relationships.map(r => r.kind)); return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.speaker < p.speakers.length).map(s => s.text), ...p.exhibits, p.session.started, p.labels.sequence, p.labels.key, ...p.elements.map(e => e.label), ...[...kinds].map(k => p.relationLabels[k])];",
  content: 'return [...p.speakers.map(s => s.label), ...p.elements.map(e => e.label)];',
  captions: "const kinds = new Set(p.relationships.map(r => r.kind)); return [p.labels.sequence, ...[...kinds].map(k => p.relationLabels[k])];",
});

ratioChecks(ID, 'order stable, states after their visit, composition fits', [
  {at: times(0.44, 0.74, 0.01), fn: 's.switchK === 0 || s.lights >= 0 ', label: 'the tracer beat runs'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits (every caption placed beside its own line)'},
  {at: [0.2, 0.5, 1], fn: "s.order === P.sequence.filter((v, i, a) => v < P.speakers.length && a.indexOf(v) === i).concat([...Array(P.speakers.length).keys()].filter(i => !P.sequence.includes(i))).join('>')", label: 'the card order is the supplied sequence at every seek'},
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
    const elBox = id => id === 'room' ? box(node(svg, 'rm-walls'))
      : id === 'participants' ? union([...nodes(svg, /^rm-p\\d$/), node(svg, 'rm-table')])
      : id === 'unit' ? box(node(svg, 'rm-lift-unit')) : id === 'clock' ? box(node(svg, 'rm-lift-clock')) : id === 'exhibit' ? box(node(svg, 'rm-lift-cab')) : box(node(svg, 'rm-lift-tray'));
    const near = (q, b, pad) => q.x >= b.l - pad && q.x <= b.r + pad && q.y >= b.t - pad && q.y <= b.b + pad;
    const lines = [];
    for (const c of nodes(svg, /^conn\\d$/)) {
      const ln = node(svg, c.getAttribute('data-node') + '-line');
      const m = ln.getScreenCTM();
      const L = ln.getTotalLength();
      const P = t => new DOMPoint(ln.getPointAtLength(t).x, ln.getPointAtLength(t).y).matrixTransform(m);
      const pts = []; for (let t = 0; t <= L; t += 2) pts.push(P(t)); pts.push(P(L));
      lines.push({i: c.getAttribute('data-node').slice(4), pts});
      const A = P(0), B = P(L);
      if (!near(A, elBox(c.getAttribute('data-from')), 3)) out.push(tag + ': ' + c.getAttribute('data-node') + ' does not start on ' + c.getAttribute('data-from'));
      if (!near(B, elBox(c.getAttribute('data-to')), 3)) out.push(tag + ': ' + c.getAttribute('data-node') + ' does not end on ' + c.getAttribute('data-to'));
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
      if ((dOther - dOwn) / k < 20) out.push(tag + ': caption rel' + i + ' only ' + Math.round((dOther - dOwn) / k) + ' px nearer its own line');
      if (lines.some(l => l.pts.some(q => q.x > b.l + 1 && q.x < b.r - 1 && q.y > b.t + 1 && q.y < b.b - 1))) out.push(tag + ': a line runs under caption rel' + i);
    }
    // the tracer is always on a connector
    for (let u = 0.44; u <= 0.745; u += 0.01) {
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

const CHIPS = ['[data-node^="el-"][data-node$="-body"]', '[data-node^="rel"][data-node$="-body"]', '[data-node^="b"][data-node$=""] circle'];

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node^="el-"]', '[data-node^="rel"]', '[data-node^="rm-lift-"]']});
noOverlapTest(ID, {markers: ['[data-node^="el-"]', '[data-node^="rel"]', '[data-node="tracer"]', '[data-node^="rm-lift-"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {});
headsClearTest(ID, {covers: ['[data-node^="el-"]', '[data-node^="rel"]', '[data-node^="rm-lift-"]', '[data-node^="conn"]']});
limbsClearTest(ID, {props: ['[data-node^="rm-sheet"]', '[data-node^="rm-card"]']});
equalWeightTest(ID, {marks: [['[data-node="rm-d-pending"] path', '[data-node="rm-d-started"] circle']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.65, 0.8, 1]});
fillMostTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID);

// Ownership of the lifted pieces' labels (rendered, at the hold): each element label's centre is nearer its own lifted
// piece's centre than any other lifted piece's by >= 20 px (1080p, horizontally: the pieces stand in one row), and no
// other piece is nearer to it edge to edge.
test(`${ID}: each lifted piece's label is clearly nearest its own piece (>= 20 px margin, rendered)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const k = 1080 / Math.min(svg.getBoundingClientRect().width, svg.getBoundingClientRect().height);
    const piece = {unit: 'rm-unit', clock: 'rm-clock', exhibit: 'rm-cabinet', tray: 'rm-tray'};
    const bx = n => { const e = node(svg, n); return e ? box(e) : null; };
    const gap = (a, c) => Math.hypot(Math.max(a.l - c.r, 0, c.l - a.r), Math.max(a.t - c.b, 0, c.t - a.b)) * k;
    const cx = a => (a.l + a.r) / 2;
    for (const [key, n] of Object.entries(piece)) {
      const lb = bx('el-' + key + '-body'), own = bx(n);
      if (!lb || !own) continue;
      for (const [k2, n2] of Object.entries(piece)) {
        if (k2 === key) continue;
        const o = bx(n2); if (!o) continue;
        const mGap = gap(lb, o) - gap(lb, own), mDx = (Math.abs(cx(lb) - cx(o)) - Math.abs(cx(lb) - cx(own))) * k;
        stat('centre margin px ' + ratio, Math.round(mDx)); stat('edge margin px ' + ratio, Math.round(mGap));
        if (mGap < 0 || mDx < 20) out.push(pr.name + ' ' + ratio + ': label of ' + key + ' margin vs ' + k2 + ' gap ' + mGap.toFixed(0) + ' / centre ' + mDx.toFixed(0) + ' px');
      }
    }
    return out;`, {});
  report(ID, 'element label ownership', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});
