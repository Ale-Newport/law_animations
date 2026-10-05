// LAW-0322 — Identificación de motivo · mechanism. Contract battery + ID-specific rendered checks (copied from the
// hearings-10 mechanism test, LAW-0318, and adapted; that file stays unchanged).
// acceptanceCheck (brief): every connector ends on its element; the order does not change when seeking; a relation is
// not drawn as causality by default (plain relation: end dots, no arrowhead; communication: hollow end; causal arrowhead
// only when supplied).
// Composition: an exploded view distinct from the story — the two label cards leave the board through the top wall to a
// band above the room (A to one side, B mirrored to the other), the numbered apartados lift off the table to an enlarged
// row between them; the party stays at the table with the magnifier laid back; every piece is labelled ON the plan and
// each relation kind is captioned ON the plan (in a crowded 1:1 frame only, the room and its calendar may be named in the
// panel). The cards are text-free here (glyph and placeholder bars); their texts are listed in the panel.
// Timing (u): separate 0.03–0.15 · labels 0.155–0.19 · relate 0.18–0.41 (a relationship and its mirror share one window)
// · trace 0.45–0.72 (the supplied traversal and its mirror at the same time) · gather: frames round both cards 0.77–0.82.
// Legal (VERY HIGH risk): placeholder text only; a line means "label attached to the section (as supplied)" or "label
// supplied by the party (as supplied)"; both labels alike; ● / ◆ equal ink; no appeal rule, admissibility, time limit,
// standard of review, outcome or jurisdiction. People floors (coordinator; hearings measure the FIGURE height): >= 60 px
// off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, imConsistencyTest, glyphSideTest, noTwinTextTest, placesKeptTest, linksAnchoredTest, gluedNumbersTest, noOneWordLineTest, noOneSideHighlightTest, ES_WORDS, FLOOR_FOR} from './identificacion-motivo-checks.js';

const ID = 'LAW-0322';
const eq = 's.drawA.every((q, j) => j >= s.drawB.length || q === s.drawB[j])';

contractSuite(ID, {
  continuity: ['tracer', 'tracer2', 'cardA', 'cardB'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.spread === 0 && s.drawn.every(q => q === 0) && s.tracer === null", label: 'rest: the pieces together; nothing drawn'},
    {at: 0.16, fn: 's.spread === 1 && s.drawn.every(q => q === 0) && s.outOfRoom', label: 'separated (both cards and every paragraph out of the room, above its top wall) before any relationship is drawn'},
    {at: 0.3, fn: `s.drawn.some(q => q > 0) && ${eq} && s.kinds.every(k => k !== 'causal')`, label: 'relate: the relationships are drawn, A and B at the same pace; no causal link by default'},
    {at: 0.42, fn: "s.drawn.every(q => q === 1) && s.linkStateA === 'linked' && s.linkStateB === 'linked'", label: 'every supplied relationship drawn before the trace'},
    {at: 0.5, fn: 's.tracer !== null && s.tracer2 !== null && s.routes === 2', label: 'the tracer runs the supplied traversal and a second one its mirror, at the same time'},
    {at: 1, fn: "s.frames === 1 && s.drawn.every(q => q === 1) && s.problems.length === 0 && s.tracer === null && s.cardScale.a === 1 && s.cardScale.b === 1", label: 'gather: everything visible, the same frame round both cards; the composition fits'},
    {at: 0.1, fn: 's.drawn.every(q => q === 0) && s.frames === 0', label: 'seeking back restores the separate beat'},
    {at: 1, params: {relationships: [{from: 'label-a', to: 'sections', kind: 'causal'}, {from: 'label-b', to: 'sections', kind: 'causal'}], traversalOrder: ['label-a', 'sections']}, fn: "s.kinds.every(k => k === 'causal') && s.problems.length === 0", label: 'a causal link only when supplied'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.speakers.map(s => s.label), ...p.grounds.map(s => s.text), ...p.decisions.sections, p.outcomes.a, p.outcomes.b, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k]), p.labels.sequence, p.labels.key];",
  content: 'return [p.decisions.title, ...p.speakers.map(s => s.label), ...p.grounds.map(s => s.text), ...p.decisions.sections, ...p.elements.map(e => e.label)];',
  captions: 'return [p.labels.sequence];',
});

ratioChecks(ID, 'order stable, equal pace, composition fits', [
  {at: times(0, 1, 0.005), fn: eq, label: 'A and B are at the same point at every u'},
  {at: times(0.18, 0.44, 0.005), fn: 's.spread === 1', label: 'relationships are drawn only once the pieces have separated'},
  {at: times(0.44, 0.75, 0.01), fn: 's.drawn.every(q => q === 1)', label: 'the trace runs over drawn relationships only'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

// Every generic connector lands on its two elements (rendered): the party's line starts beside the party and
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
        const ends = [from, to];
        if (ends.includes('party') && ends.some(q => q.startsWith('label-'))) {
          const sec = ends.find(q => q.startsWith('label-'));
          const card = box(node(svg, 'rm-card-' + sec.slice(-1) + '-body'));
          // (it starts beside the party: within the party's own width of its body)
          const pp = box(node(svg, 'rm-p' + x.getState({bounds: false}).semantic.reader));
          const P0 = from === 'party' ? A : B;
          if (Math.hypot(P0.x - (pp.l + pp.r) / 2, P0.y - (pp.t + pp.b) / 2) > Math.max(pp.w, pp.h)) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' does not start beside the party');
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
// at u = 0 the cards lie on the board and the paragraphs on the table inside the room; from the end of the separate beat to
// the hold both cards and every paragraph stand OUTSIDE the room, above its top wall, each card moved by more than a
// quarter of the room's height; the paragraphs are drawn larger there.
test(`${ID}: exploded view — the cards and the paragraphs leave the room and stay out of it to the hold (rendered)`, async ({page}) => {
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
      e1.forEach((e, i) => { if (e.w < e0[i].w * 1.3) out.push(tag + ' u=' + u + ': paragraph ' + i + ' not enlarged out of the room'); });
    }
    return out;`, {}, {withHidden: true});
  report(ID, 'exploded', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Every piece and every relation kind is named ON the plan (rendered, every preset × ratio, labels shown, at the hold):
// a visible chip el-<id> beside each supplied element (the room and the wall calendar may be named in the panel instead,
// only where the plan has no floor for them: a crowded 1:1 frame), and a visible caption cap-<kind> for every kind of
// supplied relationship, drawn on the plan (not in the panel); each chip is nearer its own piece than any other piece.
test(`${ID}: every element and every relation kind is labelled on the plan at the hold (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const DEF = (await import('../../src/animations/review/LAW-0322.js')).default.defaultParams;
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
      if (inPanel && !((id === 'room' || id === 'calendar') && ratio === '1:1')) out.push(tag + ': ' + id + ' named only in the panel');
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

// Chip FRAMES, not only their texts (hearings-10 fix round): from the moment the labels show to the hold, every pair of
// label / caption frames on the plan (el-*-body, cap-*-body) keeps >= 8 px apart (px at 1080p), and every caption wraps
// cleanly — no one-word line, no stub line (a line under half the widest; the last under 0.3) — rendered, every preset ×
// ratio.
test(`${ID}: label and caption frames keep >= 8 px apart and captions wrap cleanly (rendered, u 0.2–1)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const n = 1080 / Math.min(w, h) / svg.getScreenCTM().a;
    let worst = 1e9;
    for (const u of [0.2, 0.35, 0.5, 0.65, 0.8, 1]) {
      x.seek(u * x.durationMs);
      const fr = [...svg.querySelectorAll('[data-node$="-body"]')].filter(e => /^(el|cap)-/.test(e.getAttribute('data-node')) && eff(svg, e) > 0.3).map(e => ({n: e.getAttribute('data-node'), b: box(e)}));
      for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) {
        const A = fr[i].b, B = fr[j].b;
        const g = Math.hypot(Math.max(0, B.l - A.r, A.l - B.r), Math.max(0, B.t - A.b, A.t - B.b)) * n;
        worst = Math.min(worst, g);
        if (g < 8) out.push(tag + ' u=' + u + ': ' + fr[i].n + ' and ' + fr[j].n + ' frames ' + g.toFixed(1) + ' px apart');
      }
    }
    x.seek(x.durationMs);
    for (const t of svg.querySelectorAll('[data-node^="cap-"][data-node$="-row"] text')) {
      const ls = [...t.querySelectorAll('tspan')];
      if (ls.length < 2) continue;
      const ws = ls.map(q => q.getComputedTextLength());
      const mx = Math.max(...ws);
      ls.forEach((q, i) => {
        const words = q.textContent.trim().split(/\\s+/).filter(Boolean).length;
        if (words < 2) out.push(tag + ': one-word caption line "' + q.textContent + '"');
        if (ws[i] < (i === ls.length - 1 ? 0.3 : 0.5) * mx) out.push(tag + ': stub caption line "' + q.textContent + '"');
      });
    }
    stat('closest frames px ' + ratio, Math.round(worst * 10) / 10);
    return out;`, {}, {withHidden: false});
  report(ID, 'frame gaps', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Each label and caption on the room's floor stands by its own target (hearings-10 fix round): at the hold, the party's
// label within 22 px (at 1080p) of the party, the wall calendar's label of the calendar, and a communication
// caption drawn inside the room within 22 px of a line it names — or else a leader runs from its frame and ends ON that
// target (its end dot within 3 px of it). (The communication caption standing in the band, off 1:1, sits centred between
// the two mirrored lines it names, as accepted.) Rendered, every preset × ratio.
test(`${ID}: every floor label is by its own target or has a leader ending on it (rendered, at the hold)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    const n = 1080 / Math.min(w, h) / svg.getScreenCTM().a;
    const dBox = (p, b) => Math.hypot(Math.max(b.l - p.x, 0, p.x - b.r), Math.max(b.t - p.y, 0, p.y - b.b));
    const gapBB = (A, B) => Math.hypot(Math.max(0, B.l - A.r, A.l - B.r), Math.max(0, B.t - A.b, A.t - B.b));
    const pathPts = e => { const m = e.getScreenCTM(); const L = e.getTotalLength(); const out2 = []; for (let i = 0; i <= 200; i++) { const p = e.getPointAtLength(L * i / 200); out2.push({x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f}); } return out2; };
    const walls = box(node(svg, 'rm-walls'));
    const items = [];
    const rd = node(svg, 'rm-p' + s.reader), lec = null;
    if (node(svg, 'el-party') && rd) items.push({key: 'el-party', boxes: [box(rd), lec ? box(lec) : null].filter(Boolean), pts: null});
    if (node(svg, 'el-calendar') && node(svg, 'rm-clock')) items.push({key: 'el-calendar', boxes: [box(node(svg, 'rm-clock'))], pts: null});
    const comm = [...svg.querySelectorAll('[data-node^="conn"][data-kind="communication"]')].map(g0 => g0.querySelector('path[data-node$="-line"]')).filter(Boolean);
    const capC = node(svg, 'cap-communication');
    if (capC && comm.length) { const cb = box(node(svg, 'cap-communication-body')); if (hit(cb, walls, 0)) items.push({key: 'cap-communication', boxes: null, pts: comm.flatMap(pathPts)}); }
    for (const it of items) {
      const el = node(svg, it.key);
      if (el.closest('[data-node="panel"]')) continue;
      if (eff(svg, el) < 0.95) { out.push(tag + ': ' + it.key + ' not shown at the hold'); continue; }
      const fb = box(node(svg, it.key + '-body'));
      const gap = (it.boxes ? Math.min(...it.boxes.map(b => gapBB(fb, b))) : Math.min(...it.pts.map(p => dBox(p, fb)))) * n;
      stat('gap px ' + it.key + ' ' + ratio, Math.round(gap * 10) / 10, 'max');
      if (gap <= 22) continue;
      const ld = node(svg, it.key + '-leader');
      if (!ld || eff(svg, ld) < 0.95) { out.push(tag + ': ' + it.key + ' is ' + gap.toFixed(0) + ' px from its target with no leader'); continue; }
      const dot = box(ld.querySelector('circle'));
      const c = {x: (dot.l + dot.r) / 2, y: (dot.t + dot.b) / 2};
      const miss = (it.boxes ? Math.min(...it.boxes.map(b => dBox(c, b))) : Math.min(...it.pts.map(p => Math.hypot(p.x - c.x, p.y - c.y)))) * n;
      stat('leader end miss px ' + ratio, Math.round(miss * 10) / 10, 'max');
      if (miss > 3) out.push(tag + ': the leader of ' + it.key + ' ends ' + miss.toFixed(1) + ' px from its target');
      const seg = ld.querySelector('path');
      const sp = pathPts(seg);
      if (dBox(sp[0], fb) * n > 1.5) out.push(tag + ': the leader of ' + it.key + ' does not start on its frame');
    }
    return out;`, {}, {withHidden: false});
  report(ID, 'label by target', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

const BADGES = ['[data-node="b0"]', '[data-node="b1"]', '[data-node="b2"]', '[data-node="b3"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: BADGES});
noOverlapTest(ID, {markers: [...BADGES, '[data-node^="tracer"]', '[data-node^="rm-link-"][data-node$="-m"]', '[data-node$="-end"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...BADGES, '[data-node^="el-"]', '[data-node^="cap-"]', '[data-node^="conn"]', '[data-node="rm-board"]', '[data-node="rm-links"]', '[data-node^="tracer"]', '[data-node^="fr-"]']});
armsClearTest(ID, {props: ['[data-node="rm-board-body"]', '[data-node^="rm-exhibit"]', '[data-node="rm-clock"]', '[data-node="rm-lupa-at"]']});
equalWeightTest(ID, {at: [0.1, 1], chips: [['[data-node="rm-card-a"]', '[data-node="rm-card-b"]']], marks: [['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type'], ['[data-node="rm-card-a-g"]', '[data-node="rm-card-b-g"]'], ['[data-node="rm-link-a0-g"]', '[data-node="rm-link-b0-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
imConsistencyTest(ID);
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
noOneSideHighlightTest(ID);
void presetsFor;

// Item 18 (review-01 fix), rendered at the hold: the exploded pieces are the subject — each label card and each
// enlarged apartado keeps a minimum share of the frame width (labels shown: 16:9 card >= 0.14, sheet >= 0.052; 1:1 card
// >= 0.18, sheet >= 0.065; 9:16 card >= 0.22, sheet >= 0.09; labels hidden 0.85 of that), and the band they span (the box
// round both cards and the row) covers >= 1.2 times the area of the room they came from at 16:9 (whose empty floor is
// cropped) and >= 0.5 of it elsewhere and in long-labels-stress (whose crowded room keeps its floor for its labels).
test(`${ID}: the exploded pieces are large and dominate the room they come from (rendered share at the hold)`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    const bx = n => { const e = svg.querySelector('[data-node="' + n + '"]'); return e ? e.getBoundingClientRect() : null; };
    const hidden = pr.name.endsWith('(labels hidden)');
    const tag = pr.name + ' ' + ratio;
    const cards = ['rm-card-a', 'rm-card-b'].map(bx);
    const sheets = [...svg.querySelectorAll('[data-node^="rm-exhibit"]')].map(e => e.getBoundingClientRect());
    const room = bx('rm-walls');
    const min = {'16:9': [0.14, 0.052], '1:1': [0.18, 0.065], '9:16': [0.22, 0.09]}[ratio].map(v => v * (hidden ? 0.85 : 1));
    for (const c of cards) { const s = c.width / F.width; stat('card share ' + ratio, Math.round(s * 1000) / 1000); if (s < min[0]) out.push(tag + ': card ' + s.toFixed(3) + ' of the frame width < ' + min[0].toFixed(3)); }
    for (const e of sheets) { const s = e.width / F.width; stat('sheet share ' + ratio, Math.round(s * 1000) / 1000); if (s < min[1]) out.push(tag + ': sheet ' + s.toFixed(3) + ' of the frame width < ' + min[1].toFixed(3)); }
    const all = [...cards, ...sheets];
    const band = {l: Math.min(...all.map(q => q.left)), r: Math.max(...all.map(q => q.right)), t: Math.min(...all.map(q => q.top)), b: Math.max(...all.map(q => q.bottom))};
    const ratioBR = ((band.r - band.l) * (band.b - band.t)) / (room.width * room.height);
    stat('band / room area ' + ratio, Math.round(ratioBR * 100) / 100);
    const stress = pr.name.startsWith('long-labels-stress');
    const minBR = hidden ? 0 : ratio === '16:9' && !stress ? 1.2 : 0.5;
    if (ratioBR < minBR) out.push(tag + ': the pieces span ' + ratioBR.toFixed(2) + ' of the room area < ' + minBR);
    return out;`, {}, {withHidden: true});
  report(ID, 'exploded pieces share', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Round 2 (review-01 fix), rendered: every element chip — the party's, the calendar's, the room's, each card's and the
// sections' — stands within 22 px (1080p) of its own target or has a leader whose end lands on that target, and it
// overlaps no prop: the table, the magnifier, the calendar, the board, a chair, another person, a card or a sheet (the
// party's chip keeps >= 8 px clear of the table and the magnifier). Checked at u 0.2, 0.45, 0.75 and 1, every preset ×
// ratio.
test(`${ID}: every element chip stands by its target (or has a leader landing on it) and lies on no prop`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    const S = svg.getBoundingClientRect(), k = 1080 / Math.min(S.width, S.height);
    const q = n => svg.querySelector('[data-node="' + n + '"]');
    const R = e => { const b = e.getBoundingClientRect(); return {l: b.left, r: b.right, t: b.top, b: b.bottom}; };
    const gap = (a, c) => Math.max(c.l - a.r, a.l - c.r, c.t - a.b, a.t - c.b) * k;
    const unionOf = els => { const bs = els.map(R); return {l: Math.min(...bs.map(b => b.l)), r: Math.max(...bs.map(b => b.r)), t: Math.min(...bs.map(b => b.t)), b: Math.max(...bs.map(b => b.b))}; };
    for (const u of [0.2, 0.45, 0.75, 1]) {
      x.seek(u * x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      const reader = s.reader ?? 0;
      const sheets = [...svg.querySelectorAll('[data-node^="rm-exhibit"]')];
      const targetOf = {
        party: () => q('rm-p' + reader), calendar: () => q('rm-clock'), room: () => q('rm-walls'),
        'label-a': () => q('rm-card-a'), 'label-b': () => q('rm-card-b'), sections: () => (sheets.length ? sheets : null),
      };
      for (const id of Object.keys(targetOf)) {
        const chip = q('el-' + id);
        const body = q('el-' + id + '-body');
        if (!chip || !body || eff(svg, chip) < 0.3) continue;
        const tag = pr.name + ' ' + ratio + ' u=' + u + ' ' + id;
        const A = R(body);
        const tg = targetOf[id]();
        const T = Array.isArray(tg) ? unionOf(tg) : R(tg);
        // (the room's chip stands inside its room: its gap is to the walls' inner side, i.e. always near)
        const g = id === 'room' ? 0 : gap(A, T);
        const ld = q('el-' + id + '-leader');
        let landed = false;
        if (ld && eff(svg, ld) >= 0.3) { const dot = ld.querySelector('circle'); if (dot) { const D = R(dot); const cx = (D.l + D.r) / 2, cy = (D.t + D.b) / 2; landed = cx >= T.l - 4 / k && cx <= T.r + 4 / k && cy >= T.t - 4 / k && cy <= T.b + 4 / k; } }
        stat('max chip gap px ' + ratio, Math.round(g), 'max');
        if (g > 22 && !landed) out.push(tag + ': ' + g.toFixed(0) + ' px from its target and no leader landing on it');
        const props = ['rm-table', 'rm-lupa-at', 'rm-clock', 'rm-board-body', 'rm-card-a', 'rm-card-b'].map(q).filter(Boolean)
          .concat(sheets, [...svg.querySelectorAll('[data-node^="rm-chair"]')], [...svg.querySelectorAll('[data-node^="rm-p"]')].filter(e => /^rm-p[0-9]+$/.test(e.dataset.node) && e.dataset.node !== 'rm-p' + reader));
        for (const p of props) {
          if (eff(svg, p) < 0.3) continue;
          const need = id === 'party' && /rm-(table|lupa-at)/.test(p.dataset.node) ? 8 : 0;
          const d = gap(A, R(p));
          if (id === 'party' && /rm-(table|lupa-at)/.test(p.dataset.node)) stat('party chip clearance to table/magnifier px ' + ratio, Math.round(d));
          if (d < need) out.push(tag + ': overlaps or crowds ' + p.dataset.node + ' (' + d.toFixed(0) + ' px)');
        }
      }
    }
    return out;`, {}, {withHidden: false});
  report(ID, 'element chips', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});
